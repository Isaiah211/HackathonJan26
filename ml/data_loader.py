from __future__ import annotations

import json
from dataclasses import dataclass
from functools import cached_property
from pathlib import Path
from typing import Dict, Iterable, List, Optional

import pandas as pd

from ml import config


@dataclass
class DatasetLoader:
    """Eagerly loads datasets with caching to avoid repeated disk I/O."""

    dataset_dir: Path = config.DATASET_DIR

    def _load_json_rows(self, filename: str) -> List:
        path = self.dataset_dir / filename
        with path.open("r", encoding="utf-8") as fh:
            return json.load(fh)

    def _load_osm_elements(self, filename: str) -> List[Dict]:
        data = self._load_json_rows(filename)
        if isinstance(data, dict):
            return data.get("elements", [])
        raise ValueError(f"Unexpected OSM structure in {filename}")

    @cached_property
    def acs_df(self) -> pd.DataFrame:
        rows = self._load_json_rows("acs_albany_raw.json")
        header, data_rows = rows[0], rows[1:]
        frame = pd.DataFrame(data_rows, columns=header)
        column_mapping = {
            "B01003_001E": "population",
            "B19013_001E": "median_income",
            "B23025_005E": "unemployed",
            "B23025_003E": "labor_force",
            "tract": "tract",
            "NAME": "name",
        }
        frame = frame.rename(columns=column_mapping)
        numeric_columns = ["population", "median_income", "unemployed", "labor_force"]
        for col in numeric_columns:
            frame[col] = pd.to_numeric(frame[col], errors="coerce")
        frame["tract"] = frame["tract"].astype(str)
        return frame

    @cached_property
    def business_df(self) -> pd.DataFrame:
        return pd.DataFrame(self._extract_business_records("businessTypes.json"))

    @cached_property
    def existing_business_df(self) -> pd.DataFrame:
        return pd.DataFrame(self._extract_business_records("existingBusinessCount.json"))

    def _extract_business_records(self, filename: str) -> List[Dict]:
        elements = self._load_osm_elements(filename)
        records: List[Dict] = []
        for element in elements:
            lat = element.get("lat")
            lon = element.get("lon")
            if lat is None or lon is None:
                continue
            tags = element.get("tags", {})
            records.append(
                {
                    "lat": float(lat),
                    "lon": float(lon),
                    "category": tags.get("shop") or tags.get("amenity") or tags.get("craft"),
                    "name": tags.get("name"),
                }
            )
        return records

    @cached_property
    def transit_df(self) -> pd.DataFrame:
        path = self.dataset_dir / "google_transit" / "stops.txt"
        return pd.read_csv(path)

    @property
    def roads_path(self) -> Path:
        return self.dataset_dir / "roads.json"
