# ML Service - Python Backend for SIM-OPS

Machine Learning API service providing predictions, forecasting, and anomaly detection.

## Features

- **Churn Prediction**: Predict customer churn probability with risk levels
- **Anomaly Detection**: Detect unusual patterns in time series data
- **Revenue Forecasting**: Forecast future revenue with confidence intervals
- **CLV Prediction**: Predict customer lifetime value

## Tech Stack

- **FastAPI**: Modern Python web framework
- **scikit-learn**: Machine learning models
- **XGBoost/LightGBM**: Gradient boosting models
- **Prophet**: Time series forecasting
- **NumPy/Pandas**: Data processing

## Installation

### Option 1: Local Development

1. **Create virtual environment**:
```bash
cd ml-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies**:
```bash
pip install -r requirements.txt
```

3. **Run the service**:
```bash
python main.py
```

The service will start on `http://localhost:8000`

### Option 2: Docker

1. **Build the image**:
```bash
docker build -t simops-ml-service .
```

2. **Run the container**:
```bash
docker run -p 8000:8000 simops-ml-service
```

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Health Check
```
GET /health
```

### Churn Prediction
```
POST /predict/churn
{
  "customer_id": "cust_123",
  "features": {
    "usage_frequency": 0.5,
    "days_since_last_login": 7,
    "support_tickets_count": 2,
    "payment_failures": 0,
    "contract_length_days": 365,
    "feature_usage_rate": 0.7,
    "avg_session_duration": 15.5,
    "total_spend": 1200,
    "discount_usage": 0.1,
    "referrals_made": 2
  }
}
```

### Anomaly Detection
```
POST /detect/anomalies
{
  "metric_name": "revenue",
  "values": [100, 105, 102, 98, 150, 103],
  "timestamps": ["2024-01-01T00:00:00Z", ...]
}
```

### Revenue Forecasting
```
POST /forecast/revenue
{
  "historical_data": [
    {"date": "2024-01-01T00:00:00Z", "revenue": 100000},
    {"date": "2024-01-02T00:00:00Z", "revenue": 105000}
  ],
  "forecast_periods": 30
}
```

### CLV Prediction
```
POST /predict/clv
{
  "customer_id": "cust_123",
  "features": {
    "total_purchases": 10,
    "avg_purchase_value": 150,
    "purchase_frequency": 2.5,
    "customer_age_days": 365,
    "engagement_score": 0.8,
    "referrals_made": 3,
    "support_interactions": 2,
    "feature_adoption_rate": 0.7
  }
}
```

## Model Training

### Train a model with custom data:
```
POST /models/train/{model_name}
{
  "features": [[...], [...]],
  "labels": [0, 1, ...]
}
```

Model names: `churn`, `anomaly`, `revenue`, `clv`

## Integration with Next.js

1. **Add environment variable** to `.env.local`:
```
NEXT_PUBLIC_ML_SERVICE_URL=http://localhost:8000
```

2. **Use the ML client** in your Next.js app:
```typescript
import { mlClient } from "@/lib/ml/client";

const result = await mlClient.predictChurn({
  customer_id: "cust_123",
  features: { ... }
});
```

## Model Files

Pre-trained models are saved in `models/saved/`:
- `churn_model.pkl` - Churn prediction model
- `churn_scaler.pkl` - Feature scaler for churn
- `anomaly_model.pkl` - Anomaly detection model
- `revenue_model.pkl` - Revenue forecasting model
- `clv_model.pkl` - CLV prediction model
- `clv_scaler.pkl` - Feature scaler for CLV

## Development

### Run with auto-reload:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Run tests:
```bash
pytest tests/
```

### Format code:
```bash
black .
isort .
```

## Production Deployment

### Using Docker Compose:
```yaml
version: '3.8'
services:
  ml-service:
    build: ./ml-service
    ports:
      - "8000:8000"
    environment:
      - ENVIRONMENT=production
    restart: always
```

### Environment Variables:
- `ENVIRONMENT`: `development` or `production`
- `LOG_LEVEL`: `debug`, `info`, `warning`, `error`
- `MODEL_PATH`: Path to saved models (default: `models/saved`)

## Monitoring

The service exposes Prometheus metrics at `/metrics` for monitoring:
- Request count
- Request duration
- Model prediction latency
- Error rates

## Troubleshooting

### Models not loading:
- Check `models/saved/` directory exists
- Models will auto-train with synthetic data on first run

### Connection refused:
- Ensure service is running on port 8000
- Check firewall settings
- Verify CORS settings in `main.py`

### Slow predictions:
- Models load on first request (lazy loading)
- Consider pre-loading models on startup
- Use batch prediction endpoints for multiple requests

## Next Steps

1. **Train with real data**: Replace synthetic data with actual customer data
2. **Add more models**: Implement sentiment analysis, demand forecasting
3. **Optimize performance**: Add caching, model quantization
4. **Add monitoring**: Integrate with Prometheus/Grafana
5. **Deploy to cloud**: AWS SageMaker, Google Vertex AI, or Azure ML

## License

MIT
