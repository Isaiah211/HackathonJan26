from __future__ import annotations

import os
from typing import Literal

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from ml.prediction_service.predictor import PredictionPipeline

app = FastAPI(title="Business Impact Prediction Service")
pipeline = PredictionPipeline()


BusinessTypeLiteral = Literal["grocery", "restaurant", "retail", "service", "healthcare", "entertainment"]
BusinessScaleLiteral = Literal["small", "medium", "large"]


class ContextSignals(BaseModel):
    demand_boost: float = Field(1.0, alias="demandBoost", ge=0.5, le=1.6)
    spend_premium: float = Field(1.0, alias="spendPremium", ge=0.5, le=1.5)
    wage_premium: float = Field(1.0, alias="wagePremium", ge=0.5, le=1.5)
    confidence: float = Field(1.0, ge=0.6, le=1.2)


class PredictionRequest(BaseModel):
    business_type: BusinessTypeLiteral = Field(..., alias="businessType")
    scale: BusinessScaleLiteral
    location_key: str = Field(..., alias="locationKey", min_length=3)
    location_label: str | None = Field(default=None, alias="locationLabel")
    context_signals: ContextSignals | None = Field(default=None, alias="contextSignals")
    query: str | None = None

    class Config:
        populate_by_name = True


class PredictionResponse(BaseModel):
    wages: float
    foot_traffic: float
    local_spending: float
    sales_tax: float
    confidence: float
    jobs_created: float
    feature_snapshot: dict
    benchmarks: dict
    business_type: str
    scale: str
    context_applied: bool
    location_key: str
    location_label: str | None


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest) -> PredictionResponse:
    try:
        context_dict = request.context_signals.model_dump(by_alias=True) if request.context_signals else {}
        result = pipeline.predict(
            {
                "business_type": request.business_type,
                "scale": request.scale,
                "location_key": request.location_key,
                "context_signals": context_dict,
                "query": request.query,
            }
        )
    except KeyError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    # Ensure no duplicate location fields
    result.pop("location_key", None)
    result.pop("location_label", None)
    return PredictionResponse(
        **result,
        location_key=request.location_key,
        location_label=request.location_label,
    )


def run() -> None:
    import uvicorn

    port = int(os.environ.get("PORT", "9000"))
    uvicorn.run(app, host="0.0.0.0", port=port)


if __name__ == "__main__":
    run()
