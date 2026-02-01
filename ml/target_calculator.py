from __future__ import annotations

from dataclasses import dataclass
from typing import Dict

from ml import config
from ml.utils.geo import bbox_area_km2


@dataclass
class TargetBreakdown:
    wages: float
    foot_traffic: float
    local_spending: float
    sales_tax: float
    jobs: float


class TargetCalculator:
    """Derives business impact labels using transparent heuristics."""

    @classmethod
    def calculate(cls, location_key: str, business_type: str, scale: str, repository) -> Dict[str, float]:
        metrics = repository.get_metrics(location_key)
        jobs = cls._estimate_jobs(business_type, scale)
        base_wages = cls._estimate_wages(jobs, metrics.median_income)
        foot_traffic = cls._estimate_foot_traffic(metrics.population_density, metrics.transit_score, business_type)
        spending = foot_traffic * config.BUSINESS_TYPE_INFO[business_type]["avg_spend"]
        income_factor = 0.85 + 0.3 * (metrics.median_income / config.NATIONAL_MEDIAN_INCOME)
        adjusted_spending = max(spending * income_factor, 1.0)

        payroll_ceiling = adjusted_spending * 0.58
        payroll_floor = adjusted_spending * 0.3
        wages = min(max(base_wages, payroll_floor), payroll_ceiling)

        sales_tax = adjusted_spending * config.NY_SALES_TAX_RATE
        return {
            "wages": float(wages),
            "foot_traffic": float(foot_traffic),
            "local_spending": float(adjusted_spending),
            "sales_tax": float(sales_tax),
        }

    @staticmethod
    def _estimate_jobs(business_type: str, scale: str) -> float:
        base_jobs = config.BUSINESS_TYPE_INFO[business_type]["base_jobs"]
        scale_factor = config.SCALE_FACTORS.get(scale, 1.0)
        return max(base_jobs * scale_factor, 1.0)

    @staticmethod
    def _estimate_wages(jobs: float, median_income: float) -> float:
        median_local_wage = median_income * config.WAGE_INCOME_RATIO
        income_adjustment = median_income / config.NATIONAL_MEDIAN_INCOME
        return jobs * median_local_wage * income_adjustment

    @staticmethod
    def _estimate_foot_traffic(density: float, transit_score: float, business_type: str) -> float:
        multiplier = config.BUSINESS_TYPE_INFO[business_type]["foot_traffic_multiplier"]
        transit_factor = 1 + (transit_score / config.TRANSIT_SCORE_SCALE)
        baseline = 60.0 if density < 1500 else 120.0
        return max((density * multiplier * transit_factor) / 2.5, baseline)
