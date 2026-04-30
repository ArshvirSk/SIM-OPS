"""
Revenue Forecasting Model
Forecasts future revenue using advanced time series analysis with seasonality & trend
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Any
from datetime import datetime, timedelta
from sklearn.linear_model import Ridge
from sklearn.preprocessing import PolynomialFeatures
from sklearn.metrics import mean_absolute_error, mean_squared_error
import joblib
import os


class RevenueForecaster:
    def __init__(self):
        self.model = Ridge(alpha=1.0)
        self.poly_features = PolynomialFeatures(degree=2)
        self.trained = False
        self.trend_coef = None
        self.seasonal_pattern = None
        self.load_model()

    def load_model(self):
        """Load pre-trained model if exists"""
        model_path = "models/saved/revenue_model.pkl"
        poly_path = "models/saved/revenue_poly.pkl"

        if os.path.exists(model_path) and os.path.exists(poly_path):
            self.model = joblib.load(model_path)
            self.poly_features = joblib.load(poly_path)
            self.trained = True
        else:
            self._train_with_synthetic_data()

    def _train_with_synthetic_data(self):
        """Train with synthetic revenue data with improved seasonality"""
        np.random.seed(42)
        # Generate synthetic time series with strong trend and seasonality
        days = 400
        t = np.arange(days)

        # Components
        trend = 100000 + t * 600  # Strong growing trend
        seasonality = 15000 * np.sin(2 * np.pi * t / 30)  # Monthly cycle
        weekly = 5000 * np.sin(2 * np.pi * t / 7)  # Weekly cycle
        noise = np.random.randn(days) * 4000  # Reduced noise

        revenue = trend + seasonality + weekly + noise
        revenue = np.maximum(revenue, 0)  # No negative revenue

        # Feature engineering for polynomial regression
        X_base = t.reshape(-1, 1)
        X_poly = self.poly_features.fit_transform(X_base)

        # Add seasonal features
        sin_features = np.sin(2 * np.pi * t.reshape(-1, 1) / 30)
        cos_features = np.cos(2 * np.pi * t.reshape(-1, 1) / 30)
        week_sin = np.sin(2 * np.pi * t.reshape(-1, 1) / 7)
        week_cos = np.cos(2 * np.pi * t.reshape(-1, 1) / 7)

        X_features = np.hstack(
            [X_poly, sin_features, cos_features, week_sin, week_cos])
        y = revenue

        self.model.fit(X_features, y)

        # Store patterns for forecasting
        self.trend_coef = 600  # Daily trend increment
        self.seasonal_pattern = seasonality[:30]  # Monthly pattern

        self.trained = True

        # Save both model and poly_features
        os.makedirs("models/saved", exist_ok=True)
        joblib.dump(self.model, "models/saved/revenue_model.pkl")
        joblib.dump(self.poly_features, "models/saved/revenue_poly.pkl")

    def forecast(self, historical_data: List[Dict[str, Any]], forecast_periods: int) -> Dict[str, Any]:
        """Forecast future revenue with confidence intervals"""
        if not self.trained:
            raise Exception("Model not trained")

        # Parse historical data
        dates = [datetime.fromisoformat(d["date"].replace(
            "Z", "+00:00")) for d in historical_data]
        revenues = [float(d["revenue"]) for d in historical_data]

        # Prepare features with polynomial and seasonal components
        base_date = dates[0]
        days_since_start = np.array([(d - base_date).days for d in dates])
        X_hist_base = days_since_start.reshape(-1, 1)
        X_hist_poly = self.poly_features.transform(X_hist_base)

        # Add seasonal features
        sin_features = np.sin(2 * np.pi * days_since_start.reshape(-1, 1) / 30)
        cos_features = np.cos(2 * np.pi * days_since_start.reshape(-1, 1) / 30)
        week_sin = np.sin(2 * np.pi * days_since_start.reshape(-1, 1) / 7)
        week_cos = np.cos(2 * np.pi * days_since_start.reshape(-1, 1) / 7)

        X_hist = np.hstack(
            [X_hist_poly, sin_features, cos_features, week_sin, week_cos])
        y_hist = np.array(revenues)

        # Retrain with recent data for better accuracy
        if len(X_hist) >= 5:
            print(f"Retraining Revenue model with {len(X_hist)} data points...")
            self.model.fit(X_hist, y_hist)
        else:
            print(f"Using synthetic model (insufficient data: {len(X_hist)} < 5)")

        # Generate future dates
        last_date = dates[-1]
        future_dates = [last_date +
                        timedelta(days=i+1) for i in range(forecast_periods)]
        days_future = np.array([(d - base_date).days for d in future_dates])
        X_future_base = days_future.reshape(-1, 1)

        # Use already-fitted poly_features for future data
        X_future_poly = self.poly_features.transform(X_future_base)

        # Add seasonal features for future
        sin_future = np.sin(2 * np.pi * days_future.reshape(-1, 1) / 30)
        cos_future = np.cos(2 * np.pi * days_future.reshape(-1, 1) / 30)
        week_sin_future = np.sin(2 * np.pi * days_future.reshape(-1, 1) / 7)
        week_cos_future = np.cos(2 * np.pi * days_future.reshape(-1, 1) / 7)

        X_future = np.hstack(
            [X_future_poly, sin_future, cos_future, week_sin_future, week_cos_future])

        # Predict
        predictions = self.model.predict(X_future)
        predictions = np.maximum(predictions, 0)  # No negative revenue

        # Calculate residual-based confidence intervals (improved)
        y_train_pred = self.model.predict(X_hist)
        residuals = y_hist - y_train_pred
        std_residuals = np.std(residuals)

        # Confidence intervals (95% CI = ±1.96 * std)
        upper_bound = predictions + 1.96 * std_residuals
        lower_bound = np.maximum(predictions - 1.96 * std_residuals, 0)

        # Build predictions list
        predictions_list = [
            {
                "period": i + 1,
                "predicted_value": float(pred),
                "date": d.isoformat()
            }
            for i, (d, pred) in enumerate(zip(future_dates, predictions))
        ]

        # Build confidence intervals list
        confidence_list = [
            {
                "period": i + 1,
                "lower_bound": float(lower),
                "upper_bound": float(upper)
            }
            for i, (lower, upper) in enumerate(zip(lower_bound, upper_bound))
        ]

        # Calculate trend direction
        avg_revenue = np.mean(revenues)
        trend_value = (revenues[-1] - revenues[0]) / \
            len(revenues) if len(revenues) > 1 else 0

        if trend_value > 1000:
            trend_str = "increasing"
        elif trend_value < -1000:
            trend_str = "decreasing"
        else:
            trend_str = "stable"

        # Calculate accuracy metrics
        rmse = float(np.sqrt(np.mean(residuals**2)))
        mae = float(np.mean(np.abs(residuals)))
        mape = float(np.mean(np.abs(residuals / revenues))
                     * 100) if any(revenues) else 0.0

        return {
            "predictions": predictions_list,
            "confidence_intervals": confidence_list,
            "trend": trend_str,
            "accuracy_metrics": {
                "mae": mae,
                "rmse": rmse,
                "mape": mape
            }
        }

    def train(self, training_data: Dict[str, Any]):
        """Train model with historical revenue data and calculate metrics"""
        # Handle multiple formats
        if "historical_data" in training_data:
            hist_data = training_data["historical_data"]
            dates = [d["date"] for d in hist_data]
            revenues = [d["revenue"] for d in hist_data]
        elif "features" in training_data and "labels" in training_data:
            features = training_data["features"]
            dates = [f["date"] for f in features]
            revenues = training_data["labels"]
        else:
            dates = training_data.get("dates", [])
            revenues = training_data.get("revenues", [])

        if not dates or not revenues or len(dates) < 3:
            raise ValueError("Need at least 3 historical data points")

        # Parse dates and prepare features
        base_date = datetime.fromisoformat(dates[0].replace("Z", "+00:00"))
        days_since_start = np.array([
            (datetime.fromisoformat(d.replace("Z", "+00:00")) - base_date).days
            for d in dates
        ])

        X_base = days_since_start.reshape(-1, 1)
        X_poly = self.poly_features.fit_transform(X_base)
        sin_features = np.sin(2 * np.pi * days_since_start.reshape(-1, 1) / 30)
        cos_features = np.cos(2 * np.pi * days_since_start.reshape(-1, 1) / 30)
        week_sin = np.sin(2 * np.pi * days_since_start.reshape(-1, 1) / 7)
        week_cos = np.cos(2 * np.pi * days_since_start.reshape(-1, 1) / 7)

        X = np.hstack([X_poly, sin_features, cos_features, week_sin, week_cos])
        y = np.array(revenues)
        
        # Ensure float dtype and filter out NaN or infinite values
        X = X.astype(float)
        y = y.astype(float)
        mask = np.all(np.isfinite(X), axis=1) & np.isfinite(y)
        
        if not np.any(mask):
            raise ValueError("No valid numerical data found for training")
        
        X = X[mask]
        y = y[mask]

        # Calculate metrics using a simple split
        if len(X) > 10:
            from sklearn.model_selection import train_test_split
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False) # Keep time order
            
            self.model.fit(X_train, y_train)
            y_pred = self.model.predict(X_test)
            
            residuals = y_test - y_pred
            self.metrics = {
                "mae": float(np.mean(np.abs(residuals))),
                "rmse": float(np.sqrt(np.mean(residuals**2))),
                "mape": float(np.mean(np.abs(residuals / y_test)) * 100) if any(y_test) else 0.0,
                "data_points": len(X)
            }
        else:
            self.model.fit(X, y)
            self.metrics = {
                "mape": 0.0,
                "data_points": len(X)
            }

        self.trained = True

        # Save updated model and poly_features
        os.makedirs("models/saved", exist_ok=True)
        joblib.dump(self.model, "models/saved/revenue_model.pkl")
        joblib.dump(self.poly_features, "models/saved/revenue_poly.pkl")
        
        return self.metrics

    def is_trained(self) -> bool:
        return self.trained

    def get_info(self) -> Dict[str, Any]:
        """Get model information"""
        info = {
            "model_type": "Ridge Regression (Time Series)",
            "trained": self.trained,
            "features": ["time_index", "polynomial", "seasonality"],
            "last_updated": datetime.utcnow().isoformat()
        }
        
        if hasattr(self, 'metrics'):
            info["metrics"] = self.metrics
            
        return info
