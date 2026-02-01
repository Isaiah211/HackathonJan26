from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Tuple

import numpy as np
import pandas as pd

from ml import config
from ml.config import BUSINESS_TYPE_INFO, LOCATION_PROFILES, LocationProfile
from ml.data_loader import DatasetLoader
from ml.target_calculator import TargetCalculator
from ml.utils.geo import bbox_area_km2, point_in_bbox, segment_intersects_bbox, haversine_km

try:
    import ijson  # type: ignore
except ImportError as exc:  # pragma: no cover - dependency checked at runtime
    raise RuntimeError(
        "ijson is required for streaming OSM road data. Ensure ml/requirements.txt is installed"
    ) from exc


@dataclass
class LocationMetrics:
    population: float
    population_density: float
    median_income: float
    unemployment_rate: float
    existing_business_count: float
    business_type_counts: Dict[str, int]
    road_density: float
    transit_score: float
    area_km2: float

    def to_json(self) -> Dict:
        payload = asdict(self)
        payload["business_type_counts"] = dict(self.business_type_counts)
        return payload


class LocationFeatureRepository:
    """Aggregates spatial metrics for each configured location profile."""

    def __init__(self, loader: DatasetLoader, cache_path: Path | None = None):
        self.loader = loader
        self.cache_path = cache_path or (config.MODELS_DIR / "location_metrics.json")
        self._metrics = self._load_or_build()

    def _load_or_build(self) -> Dict[str, LocationMetrics]:
        if self.cache_path.exists():
            with self.cache_path.open("r", encoding="utf-8") as fh:
                payload = json.load(fh)
            return {key: LocationMetrics(**value) for key, value in payload.items()}
        metrics = self._build_metrics()
        with self.cache_path.open("w", encoding="utf-8") as fh:
            json.dump({k: v.to_json() for k, v in metrics.items()}, fh, indent=2)
        return metrics

    def _build_metrics(self) -> Dict[str, LocationMetrics]:
        acs_df = self.loader.acs_df
        business_df = self.loader.business_df
        existing_df = self.loader.existing_business_df
        transit_df = self.loader.transit_df
        road_lengths = self._summarize_roads()

        metrics: Dict[str, LocationMetrics] = {}
        for profile in LOCATION_PROFILES:
            area = bbox_area_km2(profile.bounding_box)
            pop_stats = self._compute_population_stats(acs_df, profile)
            business_counts = self._count_businesses(business_df, profile)
            same_type_total = sum(business_counts.values())
            existing_count = self._count_points(existing_df, profile)
            transit_score = self._compute_transit_score(transit_df, profile, area)
            road_density = road_lengths.get(profile.key, 0.0) / area
            metrics[profile.key] = LocationMetrics(
                population=pop_stats["population"],
                population_density=pop_stats["population"] / area,
                median_income=pop_stats["median_income"],
                unemployment_rate=pop_stats["unemployment_rate"],
                existing_business_count=float(existing_count),
                business_type_counts=business_counts,
                road_density=road_density,
                transit_score=transit_score,
                area_km2=area,
            )
        return metrics

    def _compute_population_stats(self, acs_df: pd.DataFrame, profile: LocationProfile) -> Dict[str, float]:
        subset = acs_df[acs_df["tract"].isin(profile.tract_ids)]
        if subset.empty:
            subset = acs_df
        population = subset["population"].sum()
        labor_force = subset["labor_force"].sum()
        unemployed = subset["unemployed"].sum()
        weighted_income = (subset["median_income"] * subset["population"].fillna(1)).sum()
        if population == 0:
            population = subset["population"].replace(0, np.nan).median()
        median_income = (weighted_income / population) if population else subset["median_income"].median()
        unemployment_rate = (unemployed / labor_force) if labor_force else 0.05
        return {
            "population": float(population or 1.0),
            "median_income": float(median_income or config.NATIONAL_MEDIAN_INCOME),
            "unemployment_rate": float(unemployment_rate),
        }

    def _count_businesses(self, business_df: pd.DataFrame, profile: LocationProfile) -> Dict[str, int]:
        counts = {key: 0 for key in BUSINESS_TYPE_INFO}
        if business_df.empty:
            return counts
        bbox = profile.bounding_box
        subset = business_df[
            (business_df["lat"] >= bbox.min_lat)
            & (business_df["lat"] <= bbox.max_lat)
            & (business_df["lon"] >= bbox.min_lon)
            & (business_df["lon"] <= bbox.max_lon)
        ]
        for _, row in subset.iterrows():
            category = self._canonical_business_type(str(row.get("category", "")))
            if category:
                counts[category] += 1
        return counts

    def _count_points(self, df: pd.DataFrame, profile: LocationProfile) -> int:
        if df.empty:
            return 0
        bbox = profile.bounding_box
        subset = df[
            (df["lat"] >= bbox.min_lat)
            & (df["lat"] <= bbox.max_lat)
            & (df["lon"] >= bbox.min_lon)
            & (df["lon"] <= bbox.max_lon)
        ]
        return int(len(subset))

    def _compute_transit_score(self, transit_df: pd.DataFrame, profile: LocationProfile, area: float) -> float:
        if transit_df.empty:
            return 0.0
        subset = transit_df[
            (transit_df["stop_lat"] >= profile.bounding_box.min_lat)
            & (transit_df["stop_lat"] <= profile.bounding_box.max_lat)
            & (transit_df["stop_lon"] >= profile.bounding_box.min_lon)
            & (transit_df["stop_lon"] <= profile.bounding_box.max_lon)
        ]
        stops_per_km2 = len(subset) / area
        return min(stops_per_km2 * 10, config.TRANSIT_SCORE_SCALE)

    def _summarize_roads(self) -> Dict[str, float]:
        totals = {profile.key: 0.0 for profile in LOCATION_PROFILES}
        with self.loader.roads_path.open("rb") as fh:
            for element in ijson.items(fh, "elements.item"):
                if element.get("type") != "way":
                    continue
                geometry = element.get("geometry") or []
                if len(geometry) < 2:
                    continue
                for idx in range(len(geometry) - 1):
                    p1 = geometry[idx]
                    p2 = geometry[idx + 1]
                    for profile in LOCATION_PROFILES:
                        if segment_intersects_bbox(p1, p2, profile.bounding_box):
                            totals[profile.key] += haversine_km(p1["lat"], p1["lon"], p2["lat"], p2["lon"])
        return totals

    def _canonical_business_type(self, raw: str | None) -> str | None:
        if not raw:
            return None
        normalized = raw.lower()
        for canonical, aliases in config.BUSINESS_TYPE_ALIASES.items():
            if normalized == canonical or normalized in aliases:
                return canonical
        return None

    def get_metrics(self, profile_key: str) -> LocationMetrics:
        try:
            return self._metrics[profile_key]
        except KeyError as exc:
            raise KeyError(f"Unknown location profile {profile_key}") from exc


class FeatureEngineer:
    """Produces ML-ready features from aggregated metrics."""

    def __init__(self, repository: LocationFeatureRepository):
        self.repository = repository
        type_features = [f"business_type_{name}" for name in BUSINESS_TYPE_INFO.keys()]
        self.feature_columns = config.FEATURE_COLUMNS_BASE + type_features

    def build_feature_vector(self, location_key: str, business_type: str, scale: str) -> Dict[str, float]:
        metrics = self.repository.get_metrics(location_key)
        features: Dict[str, float] = {
            "population_density": metrics.population_density,
            "median_income": metrics.median_income,
            "unemployment_rate": metrics.unemployment_rate,
            "existing_business_count": metrics.existing_business_count,
            "road_density": metrics.road_density,
            "transit_score": metrics.transit_score,
            "same_type_business_share": self._same_type_share(metrics, business_type),
            "scale_value": config.SCALE_FACTORS.get(scale, 1.0),
        }
        for name in BUSINESS_TYPE_INFO.keys():
            features[f"business_type_{name}"] = 1.0 if name == business_type else 0.0
        return features

    def _same_type_share(self, metrics: LocationMetrics, business_type: str) -> float:
        total = sum(metrics.business_type_counts.values()) or 1
        same_type = metrics.business_type_counts.get(business_type, 0)
        return same_type / total

    def generate_training_frame(self, replicates: int = 4) -> pd.DataFrame:
        records: List[Dict[str, float]] = []
        rng = np.random.default_rng(seed=42)
        for profile in LOCATION_PROFILES:
            for business_type in BUSINESS_TYPE_INFO.keys():
                for scale in config.SCALE_FACTORS.keys():
                    features = self.build_feature_vector(profile.key, business_type, scale)
                    targets = TargetCalculator.calculate(profile.key, business_type, scale, self.repository)
                    for _ in range(replicates):
                        noisy_features = {
                            key: value * (1 + rng.normal(0, config.TRAINING_NOISE_STD)) if value else value
                            for key, value in features.items()
                        }
                        records.append({
                            **noisy_features,
                            **targets,
                            "location_key": profile.key,
                            "business_type": business_type,
                            "scale": scale,
                        })
        frame = pd.DataFrame.from_records(records)
        return frame
