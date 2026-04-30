"""
Quick test script to verify ML service is working
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    print("Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("[OK] Health check passed")
            print(f"  Response: {response.json()}")
            return True
        else:
            print(f"[FAIL] Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"[FAIL] Cannot connect to service: {e}")
        print("  Make sure the service is running: python start.py")
        return False

def test_churn_prediction():
    """Test churn prediction"""
    print("\nTesting churn prediction...")
    try:
        data = {
            "customer_id": "test_customer",
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
        
        response = requests.post(f"{BASE_URL}/predict/churn", json=data)
        if response.status_code == 200:
            result = response.json()
            print("[OK] Churn prediction successful")
            print(f"  Churn Probability: {result['churn_probability']:.2%}")
            print(f"  Risk Level: {result['risk_level']}")
            print(f"  Recommendations: {len(result['recommended_actions'])} actions")
            return True
        else:
            print(f"[FAIL] Prediction failed: {response.status_code}")
            print(f"  Error: {response.text}")
            return False
    except Exception as e:
        print(f"[FAIL] Prediction error: {e}")
        return False

def test_anomaly_detection():
    """Test anomaly detection"""
    print("\nTesting anomaly detection...")
    try:
        data = {
            "metric_name": "test_metric",
            "values": [100, 105, 102, 98, 250, 103, 101],
            "timestamps": [
                "2024-01-01T00:00:00Z",
                "2024-01-02T00:00:00Z",
                "2024-01-03T00:00:00Z",
                "2024-01-04T00:00:00Z",
                "2024-01-05T00:00:00Z",
                "2024-01-06T00:00:00Z",
                "2024-01-07T00:00:00Z"
            ]
        }
        
        response = requests.post(f"{BASE_URL}/detect/anomalies", json=data)
        if response.status_code == 200:
            result = response.json()
            print("[OK] Anomaly detection successful")
            print(f"  Anomalies Detected: {result['anomalies_detected']}")
            print(f"  Severity: {result['severity']}")
            print(f"  Explanation: {result['explanation']}")
            return True
        else:
            print(f"[FAIL] Detection failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"[FAIL] Detection error: {e}")
        return False

def main():
    print("=" * 60)
    print("ML Service Test Suite")
    print("=" * 60)
    print()
    
    # Run tests
    health_ok = test_health()
    
    if health_ok:
        churn_ok = test_churn_prediction()
        anomaly_ok = test_anomaly_detection()
        
        print("\n" + "=" * 60)
        print("Test Results")
        print("=" * 60)
        print(f"Health Check: {'PASS' if health_ok else 'FAIL'}")
        print(f"Churn Prediction: {'PASS' if churn_ok else 'FAIL'}")
        print(f"Anomaly Detection: {'PASS' if anomaly_ok else 'FAIL'}")
        print()
        
        if health_ok and churn_ok and anomaly_ok:
            print("All tests passed! ML service is working correctly.")
            print("\nNext steps:")
            print("1. Open http://localhost:3000 in your browser")
            print("2. Navigate to 'ML Training' in the dashboard")
            print("3. Click 'Train Model' to train with your data")
        else:
            print("⚠️  Some tests failed. Check the errors above.")
    else:
        print("\n⚠️  Service is not running or not accessible.")
        print("\nTo start the service:")
        print("  Windows: start.bat")
        print("  Other: python start.py")

if __name__ == "__main__":
    main()
