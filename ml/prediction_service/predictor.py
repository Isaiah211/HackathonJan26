from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, Any

import joblib
import pandas as pd

from ml import config
from ml.data_loader import DatasetLoader
from ml.feature_engineering import FeatureEngineer, LocationFeatureRepository


class PredictionPipeline:
    """Loads the trained model and produces predictions for incoming requests."""

    def __init__(self, models_dir: Path | None = None):
        self.models_dir = models_dir or config.MODELS_DIR
        self.model = self._load_model()
        self.feature_columns = self._load_feature_columns()
        loader = DatasetLoader()
        self.repository = LocationFeatureRepository(loader)
        self.engineer = FeatureEngineer(self.repository)
        self.benchmarks = self._compute_benchmarks()

    def _load_model(self):
        model_path = self.models_dir / "business_impact_model.pkl"
        if not model_path.exists():
            raise FileNotFoundError(f"Trained model not found at {model_path}. Run train_model.py first.")
        return joblib.load(model_path)

    def _load_feature_columns(self) -> list[str]:
        metadata_path = self.models_dir / "feature_columns.json"
        if not metadata_path.exists():
            raise FileNotFoundError("feature_columns.json missing. Cannot perform inference.")
        with metadata_path.open("r", encoding="utf-8") as fh:
            payload = json.load(fh)
        return payload["features"]

    def predict(self, payload: Dict[str, Any]) -> Dict[str, float]:
        business_type = payload["business_type"].lower()
        scale = payload["scale"].lower()
        location_key = payload["location_key"].lower()
        context_signals = payload.get("context_signals") or {}

        features = self.engineer.build_feature_vector(location_key, business_type, scale)
        features_frame = pd.DataFrame([features])[self.feature_columns]
        predictions = self.model.predict(features_frame)[0]

        metrics = self.repository.get_metrics(location_key)
        jobs_created = max(
            config.BUSINESS_TYPE_INFO[business_type]["base_jobs"] * config.SCALE_FACTORS.get(scale, 1.0),
            1.0,
        )

        base_prediction = {
            "wages": float(predictions[0]),
            "foot_traffic": float(predictions[1]),
            "local_spending": float(predictions[2]),
            "sales_tax": float(predictions[3]),
            "jobs_created": float(jobs_created),
        }

        adjusted = self._apply_context_adjustments(base_prediction, context_signals)
        adjusted["feature_snapshot"] = {
            "population_density": metrics.population_density,
            "median_income": metrics.median_income,
            "unemployment_rate": metrics.unemployment_rate,
            "transit_score": metrics.transit_score,
            "existing_business_count": metrics.existing_business_count,
        }
        adjusted["benchmarks"] = self.benchmarks
        adjusted["location_key"] = location_key
        adjusted["business_type"] = business_type
        adjusted["scale"] = scale
        adjusted["context_applied"] = bool(context_signals)
        return adjusted

    def _apply_context_adjustments(self, base: Dict[str, float], context: Dict[str, Any]) -> Dict[str, float]:
        def clamp(value: float, low: float, high: float) -> float:
            return max(low, min(high, value))

        demand_boost = clamp(float(context.get("demandBoost", 1.0)), 0.6, 1.8)
        spend_premium = clamp(float(context.get("spendPremium", 1.0)), 0.65, 1.6)
        wage_premium = clamp(float(context.get("wagePremium", 1.0)), 0.65, 1.45)
        confidence = clamp(float(context.get("confidence", 1.0)), 0.7, 1.15)

        foot_traffic = base["foot_traffic"] * demand_boost
        local_spending = base["local_spending"] * demand_boost * spend_premium

        payroll_ceiling = local_spending * 0.58
        payroll_floor = local_spending * 0.28
        wages = max(min(base["wages"] * wage_premium, payroll_ceiling), payroll_floor)
        sales_tax = local_spending * config.NY_SALES_TAX_RATE
        jobs_multiplier = clamp((demand_boost * 0.6) + (wage_premium * 0.3) + (spend_premium * 0.1), 0.7, 1.6)
        jobs_created = max(base.get("jobs_created", 0.0) * jobs_multiplier, 1.0)

        return {
            "wages": float(wages),
            "foot_traffic": float(foot_traffic),
            "local_spending": float(local_spending),
            "sales_tax": float(sales_tax),
            "confidence": float(confidence),
            "jobs_created": float(jobs_created),
        }

    def _compute_benchmarks(self) -> Dict[str, float]:
        values = {
            "population_density": [],
            "median_income": [],
            "unemployment_rate": [],
            "transit_score": [],
            "existing_business_count": [],
        }
        for metrics in self.repository._metrics.values():
            values["population_density"].append(metrics.population_density)
            values["median_income"].append(metrics.median_income)
            values["unemployment_rate"].append(metrics.unemployment_rate)
            values["transit_score"].append(metrics.transit_score)
            values["existing_business_count"].append(metrics.existing_business_count)

        def safe_avg(items):
            return float(sum(items) / len(items)) if items else 0.0

        return {key: safe_avg(val) for key, val in values.items()}
