"""
Anomaly Detection Model
Detects anomalies in time series metrics using ensemble methods for better accuracy
"""

import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from scipy import stats
from typing import List, Dict, Any
from datetime import datetime
import joblib
import os


class AnomalyDetector:
    def __init__(self):
        self.model = IsolationForest(
            contamination=0.08,  # Improved contamination rate
            random_state=42,
            n_estimators=200
        )
        self.scaler = StandardScaler()
        self.trained = False
        self.mean = None
        self.std = None
        self.load_model()

    def load_model(self):
        """Load pre-trained model if exists"""
        model_path = "models/saved/anomaly_model.pkl"

        if os.path.exists(model_path):
            self.model = joblib.load(model_path)
            self.trained = True
        else:
            self._train_with_synthetic_data()

    def _train_with_synthetic_data(self):
        """Train with synthetic normal data"""
        np.random.seed(42)
        # Generate normal data with realistic distribution
        normal_data = np.random.normal(loc=100, scale=15, size=2000)
        normal_data = np.clip(normal_data, 50, 150)  # Realistic bounds
        normal_data = normal_data.reshape(-1, 1)

        self.mean = normal_data.mean()
        self.std = normal_data.std()

        self.model.fit(normal_data)
        self.trained = True
        
        # Initialize metrics for synthetic data
        self.metrics = {
            "data_points": 2000,
            "contamination": self.model.contamination
        }

        # Save model
        os.makedirs("models/saved", exist_ok=True)
        joblib.dump(self.model, "models/saved/anomaly_model.pkl")

    def detect(self, metric_name: str, values: List[float], timestamps: List[str]) -> Dict[str, Any]:
        """Detect anomalies using ensemble approach (Isolation Forest + Statistical)"""
        if not self.trained:
            raise Exception("Model not trained")

        # Prepare data
        X = np.array(values).reshape(-1, 1)

        # Method 1: Isolation Forest predictions
        if_predictions = self.model.predict(X)
        if_scores = self.model.score_samples(X)
        if_anomalies = np.where(if_predictions == -1)[0]

        # Method 2: Statistical Z-score detection
        z_scores = np.abs(stats.zscore(values))
        z_anomalies = np.where(z_scores > 2.5)[0]  # 2.5 sigma threshold

        # Method 3: Interquartile Range (IQR)
        q1 = np.percentile(values, 25)
        q3 = np.percentile(values, 75)
        iqr = q3 - q1
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        iqr_anomalies = np.where(
            (X[:, 0] < lower_bound) | (X[:, 0] > upper_bound))[0]

        # Combine detections (ensemble voting)
        anomaly_votes = np.zeros(len(values))
        anomaly_votes[if_anomalies] += 1
        anomaly_votes[z_anomalies] += 1
        anomaly_votes[iqr_anomalies] += 1

        # Final anomalies: detected by at least 2 methods
        final_anomalies = np.where(anomaly_votes >= 2)[0].tolist()
        anomaly_scores = if_scores[final_anomalies].tolist() if len(
            final_anomalies) > 0 else []

        # Determine severity
        anomaly_percentage = len(final_anomalies) / \
            len(values) if len(values) > 0 else 0

        if len(final_anomalies) == 0:
            severity = "none"
            explanation = "No anomalies detected (all checks passed)"
        elif anomaly_percentage <= 0.03:
            severity = "low"
            explanation = f"Minor anomalies detected at {len(final_anomalies)} points ({anomaly_percentage*100:.1f}%)"
        elif anomaly_percentage <= 0.10:
            severity = "medium"
            explanation = f"Moderate anomalies detected at {len(final_anomalies)} points ({anomaly_percentage*100:.1f}%)"
        else:
            severity = "high"
            explanation = f"Significant anomalies detected at {len(final_anomalies)} points ({anomaly_percentage*100:.1f}%)"

        # Add context about anomalous values
        context = ""
        if final_anomalies:
            anomalous_values = [values[i] for i in final_anomalies]
            normal_values = [v for i, v in enumerate(
                values) if i not in final_anomalies]
            avg_normal = np.mean(
                normal_values) if normal_values else np.mean(values)
            avg_anomaly = np.mean(anomalous_values)

            if avg_anomaly > avg_normal * 1.5:
                explanation += f". Values are {((avg_anomaly/avg_normal - 1) * 100):.1f}% higher than normal"
            elif avg_anomaly < avg_normal * 0.5:
                explanation += f". Values are {((1 - avg_anomaly/avg_normal) * 100):.1f}% lower than normal"

        # Return response in format matching AnomalyDetectionResponse
        return {
            "anomalies_detected": len(final_anomalies) > 0,
            "anomaly_indices": final_anomalies,
            "anomaly_scores": [float(if_scores[idx]) for idx in final_anomalies],
            "severity": severity,
            "explanation": explanation
        }

    def train(self, training_data: Dict[str, Any]):
        """Train model with normal data"""
        X = np.array(training_data["values"]).reshape(-1, 1)
        
        # Filter out NaN or infinite values
        mask = np.all(np.isfinite(X), axis=1)
        if not np.any(mask):
            raise ValueError("No valid numerical data found for training")
            
        X = X[mask]
        
        self.model.fit(X)
        self.trained = True
        
        # Anomaly detection is unsupervised, so we store point count as a basic metric
        self.metrics = {
            "data_points": len(X),
            "contamination": self.model.contamination
        }

        # Save updated model
        os.makedirs("models/saved", exist_ok=True)
        joblib.dump(self.model, "models/saved/anomaly_model.pkl")
        
        return self.metrics

    def is_trained(self) -> bool:
        return self.trained

    def get_info(self) -> Dict[str, Any]:
        """Get model information"""
        info = {
            "model_type": "Isolation Forest (Ensemble)",
            "trained": self.trained,
            "features": ["numerical_metric"],
            "last_updated": datetime.utcnow().isoformat()
        }
        
        if hasattr(self, 'metrics'):
            info["metrics"] = self.metrics
        else:
            info["metrics"] = {
                "contamination": self.model.contamination,
                "n_estimators": self.model.n_estimators
            }
            
        return info
