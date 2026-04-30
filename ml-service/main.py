"""
ML Service - FastAPI Backend for SIM-OPS
Provides ML predictions, anomaly detection, and forecasting
"""

from datetime import datetime
import uvicorn
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException
from models.clv_predictor import CLVPredictor
from models.revenue_forecaster import RevenueForecaster
from models.anomaly_detector import AnomalyDetector
from models.churn_predictor import ChurnPredictor
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Debug: Print environment variables
api_key = os.getenv("GOOGLE_AI_API_KEY")
print(f"\n{'='*60}")
print(f"STARTUP DEBUG INFO")
print(f"{'='*60}")
print(f"GOOGLE_AI_API_KEY loaded: {bool(api_key)}")
if api_key:
    print(f"  Key length: {len(api_key)}")
    print(f"  First 20 chars: {api_key[:20]}...")
print(f"{'='*60}\n")


app = FastAPI(
    title="SIM-OPS ML Service",
    description="Machine Learning API for Smart Intelligence Management",
    version="1.0.0"
)

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ML models
churn_model = ChurnPredictor()
anomaly_model = AnomalyDetector()
revenue_model = RevenueForecaster()
clv_model = CLVPredictor()


# Request/Response Models
class ChurnPredictionRequest(BaseModel):
    customer_id: str
    # usage_frequency, payment_history, support_tickets, etc.
    features: Dict[str, Any]


class ChurnPredictionResponse(BaseModel):
    customer_id: str
    churn_probability: float
    risk_level: str  # low, medium, high, critical
    contributing_factors: List[Dict[str, Any]]
    recommended_actions: List[str]
    confidence: float


class AnomalyDetectionRequest(BaseModel):
    metric_name: str
    values: List[float]
    timestamps: List[str]


class AnomalyDetectionResponse(BaseModel):
    anomalies_detected: bool
    anomaly_indices: List[int]
    anomaly_scores: List[float]
    severity: str
    explanation: str


class RevenueForecastRequest(BaseModel):
    historical_data: List[Dict[str, Any]]
    forecast_periods: int  # days to forecast


class RevenueForecastResponse(BaseModel):
    predictions: List[Dict[str, Any]]
    confidence_intervals: List[Dict[str, Any]]
    trend: str  # increasing, decreasing, stable
    accuracy_metrics: Dict[str, float]


class CLVPredictionRequest(BaseModel):
    customer_id: str
    features: Dict[str, Any]


class CLVPredictionResponse(BaseModel):
    customer_id: str
    predicted_clv: float
    clv_segment: str  # low, medium, high, premium
    confidence: float
    factors: List[Dict[str, Any]]


class BatchPredictionRequest(BaseModel):
    customers: List[Dict[str, Any]]


# Health check
@app.get("/")
async def root():
    return {
        "service": "SIM-OPS ML Service",
        "status": "running",
        "version": "1.0.0",
        "models": {
            "churn_predictor": churn_model.is_trained(),
            "anomaly_detector": anomaly_model.is_trained(),
            "revenue_forecaster": revenue_model.is_trained(),
            "clv_predictor": clv_model.is_trained(),
        }
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


# Churn Prediction Endpoints
@app.post("/predict/churn", response_model=ChurnPredictionResponse)
async def predict_churn(request: ChurnPredictionRequest):
    """Predict customer churn probability"""
    try:
        result = churn_model.predict(request.customer_id, request.features)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/churn/batch")
async def predict_churn_batch(request: BatchPredictionRequest):
    """Batch churn prediction for multiple customers"""
    try:
        results = []
        for customer in request.customers:
            result = churn_model.predict(
                customer.get("customer_id"),
                customer.get("features", {})
            )
            results.append(result)
        return {"predictions": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Anomaly Detection Endpoints
@app.post("/detect/anomalies", response_model=AnomalyDetectionResponse)
async def detect_anomalies(request: AnomalyDetectionRequest):
    """Detect anomalies in time series data"""
    try:
        result = anomaly_model.detect(
            request.metric_name,
            request.values,
            request.timestamps
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Revenue Forecasting Endpoints
@app.post("/forecast/revenue", response_model=RevenueForecastResponse)
async def forecast_revenue(request: RevenueForecastRequest):
    """Forecast future revenue"""
    try:
        result = revenue_model.forecast(
            request.historical_data,
            request.forecast_periods
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# CLV Prediction Endpoints
@app.post("/predict/clv", response_model=CLVPredictionResponse)
async def predict_clv(request: CLVPredictionRequest):
    """Predict customer lifetime value"""
    try:
        result = clv_model.predict(request.customer_id, request.features)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Revenue Training Endpoint
@app.post("/train/revenue")
async def train_revenue_model(request: RevenueForecastRequest):
    """Train revenue forecaster with historical data"""
    try:
        metrics = revenue_model.train({
            "historical_data": request.historical_data,
            "forecast_periods": request.forecast_periods
        })
        return {
            "status": "success",
            "model": "revenue_forecaster",
            "metrics": metrics,
            "trained_at": datetime.utcnow().isoformat(),
            "message": "Model successfully trained with real historical data"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Model Management Endpoints
@app.post("/models/train/{model_name}")
async def train_model(model_name: str, training_data: Dict[str, Any]):
    """Train or retrain a specific model"""
    try:
        metrics = None
        if model_name == "churn":
            metrics = churn_model.train(training_data)
        elif model_name == "anomaly":
            metrics = anomaly_model.train(training_data)
        elif model_name == "revenue":
            metrics = revenue_model.train(training_data)
        elif model_name == "clv":
            metrics = clv_model.train(training_data)
        else:
            raise HTTPException(status_code=404, detail="Model not found")

        return {
            "status": "success", 
            "model": model_name, 
            "metrics": metrics,
            "trained_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/models/info/{model_name}")
async def get_model_info(model_name: str):
    """Get information about a specific model"""
    try:
        if model_name == "churn":
            info = churn_model.get_info()
        elif model_name == "anomaly":
            info = anomaly_model.get_info()
        elif model_name == "revenue":
            info = revenue_model.get_info()
        elif model_name == "clv":
            info = clv_model.get_info()
        else:
            raise HTTPException(status_code=404, detail="Model not found")

        return info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
