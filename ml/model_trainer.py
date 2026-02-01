from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Tuple

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.multioutput import MultiOutputRegressor

from ml import config
from ml.data_loader import DatasetLoader
from ml.feature_engineering import FeatureEngineer, LocationFeatureRepository


@dataclass
class TrainingArtifacts:
    model_path: Path
    feature_columns_path: Path
    metadata_path: Path
    dataset_export_path: Path


class ModelTrainer:
    def __init__(self, output_dir: Path | None = None):
        self.output_dir = output_dir or config.MODELS_DIR
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.dataset_output = config.CACHE_DIR / "merged_training_data.json"

    def run(self) -> TrainingArtifacts:
        loader = DatasetLoader()
        repository = LocationFeatureRepository(loader)
        engineer = FeatureEngineer(repository)
        training_frame = engineer.generate_training_frame()

        feature_columns = engineer.feature_columns
        target_columns = config.TARGET_COLUMNS

        X = training_frame[feature_columns]
        y = training_frame[target_columns]

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        estimator = MultiOutputRegressor(
            RandomForestRegressor(
                n_estimators=300,
                max_depth=18,
                min_samples_split=4,
                random_state=42,
                n_jobs=-1,
            )
        )
        estimator.fit(X_train, y_train)

        predictions = estimator.predict(X_test)
        eval_stats = self._evaluate(y_test, predictions, target_columns)

        model_path = self.output_dir / "business_impact_model.pkl"
        joblib.dump(estimator, model_path)

        feature_columns_path = self.output_dir / "feature_columns.json"
        metadata_path = self.output_dir / "model_metadata.json"
        dataset_export_path = self.dataset_output

        with feature_columns_path.open("w", encoding="utf-8") as fh:
            json.dump({
                "features": feature_columns,
                "targets": target_columns,
            }, fh, indent=2)

        with metadata_path.open("w", encoding="utf-8") as fh:
            json.dump(
                {
                    "r2": eval_stats["r2"],
                    "mae": eval_stats["mae"],
                    "n_samples": len(training_frame),
                },
                fh,
                indent=2,
            )

        training_frame.to_json(dataset_export_path, orient="records", indent=2)

        return TrainingArtifacts(
            model_path=model_path,
            feature_columns_path=feature_columns_path,
            metadata_path=metadata_path,
            dataset_export_path=dataset_export_path,
        )

    def _evaluate(
        self, y_true: pd.DataFrame, y_pred, target_columns: Tuple[str, ...] | list[str]
    ) -> Dict[str, Dict[str, float]]:
        r2_scores: Dict[str, float] = {}
        mae_scores: Dict[str, float] = {}
        for idx, column in enumerate(target_columns):
            r2_scores[column] = float(r2_score(y_true.iloc[:, idx], y_pred[:, idx]))
            mae_scores[column] = float(mean_absolute_error(y_true.iloc[:, idx], y_pred[:, idx]))
        return {"r2": r2_scores, "mae": mae_scores}
