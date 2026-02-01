from __future__ import annotations

import math
from dataclasses import asdict
from typing import Dict

from ml.config import BoundingBox


EARTH_RADIUS_KM = 6371.0


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Compute haversine distance between two lat/lon points in kilometers."""
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = lat2_rad - lat1_rad
    delta_lon = math.radians(lon2 - lon1)
    a = math.sin(delta_lat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return EARTH_RADIUS_KM * c


def point_in_bbox(lat: float, lon: float, bbox: BoundingBox) -> bool:
    return bbox.min_lat <= lat <= bbox.max_lat and bbox.min_lon <= lon <= bbox.max_lon


def bbox_area_km2(bbox: BoundingBox) -> float:
    lat_span = bbox.max_lat - bbox.min_lat
    lon_span = bbox.max_lon - bbox.min_lon
    if lat_span <= 0 or lon_span <= 0:
        return 0.01
    center_lat = (bbox.max_lat + bbox.min_lat) / 2
    lat_km = lat_span * 111.32
    lon_km = lon_span * 111.32 * math.cos(math.radians(center_lat))
    area = abs(lat_km * lon_km)
    return max(area, 0.01)


def segment_intersects_bbox(p1: Dict[str, float], p2: Dict[str, float], bbox: BoundingBox) -> bool:
    min_lat = min(p1["lat"], p2["lat"])
    max_lat = max(p1["lat"], p2["lat"])
    min_lon = min(p1["lon"], p2["lon"])
    max_lon = max(p1["lon"], p2["lon"])
    overlaps_lat = not (max_lat < bbox.min_lat or min_lat > bbox.max_lat)
    overlaps_lon = not (max_lon < bbox.min_lon or min_lon > bbox.max_lon)
    return overlaps_lat and overlaps_lon


def bbox_to_dict(bbox: BoundingBox) -> Dict[str, float]:
    return asdict(bbox)
