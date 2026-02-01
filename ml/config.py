from __future__ import annotations

from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Dict, List

BASE_DIR = Path(__file__).resolve().parent
DATASET_DIR = BASE_DIR.parent / "backend" / "datasets"
MODELS_DIR = BASE_DIR / "models"
CACHE_DIR = BASE_DIR / "datasets"

MODELS_DIR.mkdir(parents=True, exist_ok=True)
CACHE_DIR.mkdir(parents=True, exist_ok=True)


@dataclass(frozen=True)
class BoundingBox:
    min_lat: float
    max_lat: float
    min_lon: float
    max_lon: float

    def as_dict(self) -> Dict[str, float]:
        return asdict(self)


@dataclass(frozen=True)
class LocationProfile:
    key: str
    name: str
    bounding_box: BoundingBox
    tract_ids: List[str]
    aliases: List[str]

    def matches(self, value: str) -> bool:
        needle = value.lower().strip()
        return needle == self.key or needle in [alias.lower() for alias in self.aliases]


LOCATION_PROFILES: List[LocationProfile] = [
    LocationProfile(
        key="downtown_albany",
        name="Downtown Albany",
        bounding_box=BoundingBox(42.6405, 42.6635, -73.7735, -73.7375),
        tract_ids=["000100", "000201"],
        aliases=["downtown albany", "center square", "state capitol"],
    ),
    LocationProfile(
        key="central_ave",
        name="Central Avenue Corridor",
        bounding_box=BoundingBox(42.654, 42.689, -73.811, -73.745),
        tract_ids=["000401", "000402", "000501"],
        aliases=["central ave", "midtown albany", "pine hills"],
    ),
    LocationProfile(
        key="arbor_hill",
        name="Arbor Hill",
        bounding_box=BoundingBox(42.665, 42.695, -73.774, -73.733),
        tract_ids=["000300", "000302"],
        aliases=["arbor hill", "north albany"],
    ),
    LocationProfile(
        key="wolf_road",
        name="Wolf Road / Colonie Center",
        bounding_box=BoundingBox(42.697, 42.735, -73.836, -73.776),
        tract_ids=["010400", "010500", "010600"],
        aliases=["wolf road", "colonie center", "colonie"],
    ),
]

BUSINESS_TYPE_INFO: Dict[str, Dict[str, float]] = {
    "grocery": {
        "avg_spend": 48.0,
        "foot_traffic_multiplier": 1.8,
        "base_jobs": 16.0,
    },
    "restaurant": {
        "avg_spend": 32.0,
        "foot_traffic_multiplier": 2.3,
        "base_jobs": 22.0,
    },
    "retail": {
        "avg_spend": 60.0,
        "foot_traffic_multiplier": 1.6,
        "base_jobs": 14.0,
    },
    "service": {
        "avg_spend": 85.0,
        "foot_traffic_multiplier": 1.2,
        "base_jobs": 10.0,
    },
    "healthcare": {
        "avg_spend": 110.0,
        "foot_traffic_multiplier": 1.1,
        "base_jobs": 28.0,
    },
    "entertainment": {
        "avg_spend": 42.0,
        "foot_traffic_multiplier": 2.0,
        "base_jobs": 18.0,
    },
}

BUSINESS_TYPE_ALIASES: Dict[str, List[str]] = {
    "grocery": ["grocery", "market", "supermarket", "food store"],
    "restaurant": ["restaurant", "diner", "eatery", "cafe"],
    "retail": ["retail", "boutique", "store", "shop"],
    "service": ["service", "salon", "laundry", "repair"],
    "healthcare": ["clinic", "medical", "pharmacy", "hospital"],
    "entertainment": ["entertainment", "theater", "cinema", "venue"],
}

SCALE_FACTORS: Dict[str, float] = {
    "small": 0.65,
    "medium": 1.0,
    "large": 1.8,
}

TRAINING_NOISE_STD = 0.04
NATIONAL_MEDIAN_INCOME = 74780
WAGE_INCOME_RATIO = 0.62
NY_SALES_TAX_RATE = 0.08
TRANSIT_SCORE_SCALE = 120.0

FEATURE_COLUMNS_BASE = [
    "population_density",
    "median_income",
    "unemployment_rate",
    "existing_business_count",
    "road_density",
    "transit_score",
    "same_type_business_share",
    "scale_value",
]

TARGET_COLUMNS = ["wages", "foot_traffic", "local_spending", "sales_tax"]


def get_location_profile(key: str) -> LocationProfile:
    normalized = key.lower().strip()
    for profile in LOCATION_PROFILES:
        if profile.key == normalized or profile.matches(normalized):
            return profile
    raise KeyError(f"Unknown location profile: {key}")
