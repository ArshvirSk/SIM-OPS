"""
Train ML models with Kaggle datasets - Python 3.13 compatible
"""
import os
import sys

# Suppress all warnings before importing numpy
import warnings
warnings.filterwarnings('ignore')
os.environ['PYTHONWARNINGS'] = 'ignore'

# Suppress numpy-specific warnings
import numpy as np
np.seterr(all='ignore')

import pandas as pd

print("=" * 60)
print("ML Model Training with Kaggle Datasets")
print("=" * 60)
print()

# Import models
try:
    from models.churn_predictor import ChurnPredictor
    from models.clv_predictor import CLVPredictor
    from models.anomaly_detector import AnomalyDetector
    from models.revenue_forecaster import RevenueForecaster
    print("✓ Models imported successfully")
except Exception as e:
    print(f"✗ Error importing models: {e}")
    sys.exit(1)

# Check datasets
telco_exists = os.path.exists("data/telco_churn.csv")
retail_exists = os.path.exists("data/online_retail.csv")

print(f"✓ Telco dataset: {'FOUND' if telco_exists else 'NOT FOUND'}")
print(f"✓ Retail dataset: {'FOUND' if retail_exists else 'NOT FOUND'}")
print()

# Train Churn Model
if telco_exists:
    print("[1/4] Training Churn Model with real data...")
    try:
        df = pd.read_csv("data/telco_churn.csv")
        print(f"  Loaded {len(df)} customers")
        
        # Convert TotalCharges
        df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce')
        df['TotalCharges'].fillna(df['TotalCharges'].median(), inplace=True)
        
        # Create features
        features = []
        labels = []
        
        for _, row in df.iterrows():
            feature_vector = [
                1.0 if row['Contract'] == 'Month-to-month' else 0.5,
                0 if row['tenure'] > 12 else row['tenure'],
                1 if row['TechSupport'] == 'No' else 0,
                1 if row['PaymentMethod'] == 'Electronic check' else 0,
                row['tenure'] * 30,
                0.7 if row['OnlineSecurity'] == 'Yes' else 0.3,
                row['tenure'] * 2,
                float(row['TotalCharges']),
                0.1 if row['Contract'] != 'Month-to-month' else 0,
                0
            ]
            features.append(feature_vector)
            labels.append(1 if row['Churn'] == 'Yes' else 0)
        
        # Train
        churn_model = ChurnPredictor()
        training_data = {
            'features': np.array(features),
            'labels': np.array(labels)
        }
        churn_model.train(training_data)
        
        # Test accuracy
        from sklearn.model_selection import train_test_split
        from sklearn.metrics import accuracy_score
        
        X_train, X_test, y_train, y_test = train_test_split(
            features, labels, test_size=0.2, random_state=42
        )
        X_test_scaled = churn_model.scaler.transform(X_test)
        y_pred = churn_model.model.predict(X_test_scaled)
        accuracy = accuracy_score(y_test, y_pred)
        
        print(f"  ✓ Trained on {len(features)} samples")
        print(f"  ✓ Test accuracy: {accuracy:.2%}")
        print(f"  ✓ Churn rate: {sum(labels)/len(labels):.2%}")
    except Exception as e:
        print(f"  ✗ Error: {e}")
else:
    print("[1/4] Skipping Churn Model (no dataset)")

print()

# Train CLV Model
if retail_exists:
    print("[2/4] Training CLV Model with real data...")
    try:
        df = pd.read_csv("data/online_retail.csv", encoding='ISO-8859-1')
        print(f"  Loaded {len(df)} transactions")
        
        # Clean data
        df = df[df['CustomerID'].notna()]
        df = df[df['Quantity'] > 0]
        df = df[df['UnitPrice'] > 0]
        df['TotalPrice'] = df['Quantity'] * df['UnitPrice']
        
        # Aggregate by customer
        customer_features = df.groupby('CustomerID').agg({
            'InvoiceNo': 'count',
            'TotalPrice': ['sum', 'mean'],
            'InvoiceDate': lambda x: (pd.to_datetime(x.max()) - pd.to_datetime(x.min())).days
        }).reset_index()
        
        customer_features.columns = ['CustomerID', 'total_purchases', 'total_spend', 'avg_purchase_value', 'customer_age_days']
        customer_features['purchase_frequency'] = customer_features['total_purchases'] / (customer_features['customer_age_days'] + 1)
        
        # Remove invalid values
        customer_features = customer_features.replace([np.inf, -np.inf], np.nan)
        customer_features = customer_features.dropna()
        customer_features = customer_features[customer_features['total_spend'] > 0]
        
        # Create features
        features = []
        labels = []
        
        for _, row in customer_features.iterrows():
            feature_vector = [
                float(row['total_purchases']),
                float(row['avg_purchase_value']),
                float(row['purchase_frequency']),
                float(row['customer_age_days']),
                0.7, 0, 0, 0.5
            ]
            features.append(feature_vector)
            labels.append(float(row['total_spend']))
        
        # Train
        clv_model = CLVPredictor()
        training_data = {
            'features': np.array(features),
            'clv_values': np.array(labels)  # Changed from 'labels' to 'clv_values'
        }
        clv_model.train(training_data)
        
        # Test
        from sklearn.model_selection import train_test_split
        from sklearn.metrics import mean_absolute_error, r2_score
        
        X_train, X_test, y_train, y_test = train_test_split(
            features, labels, test_size=0.2, random_state=42
        )
        X_test_scaled = clv_model.scaler.transform(X_test)
        y_pred = clv_model.model.predict(X_test_scaled)
        
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        print(f"  ✓ Trained on {len(features)} customers")
        print(f"  ✓ MAE: ${mae:.2f}")
        print(f"  ✓ R² Score: {r2:.2%}")
        print(f"  ✓ Avg CLV: ${np.mean(labels):.2f}")
    except Exception as e:
        print(f"  ✗ Error: {e}")
else:
    print("[2/4] Skipping CLV Model (no dataset)")

print()

# Train Anomaly Model
if telco_exists:
    print("[3/4] Training Anomaly Model...")
    try:
        df = pd.read_csv("data/telco_churn.csv")
        df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce')
        df['TotalCharges'].fillna(df['TotalCharges'].median(), inplace=True)
        
        normal_data = df[df['Churn'] == 'No']['MonthlyCharges'].values
        
        anomaly_model = AnomalyDetector()
        training_data = {'values': normal_data.tolist()}
        anomaly_model.train(training_data)
        
        print(f"  ✓ Trained on {len(normal_data)} samples")
        print(f"  ✓ Range: ${normal_data.min():.2f} - ${normal_data.max():.2f}")
    except Exception as e:
        print(f"  ✗ Error: {e}")
else:
    print("[3/4] Skipping Anomaly Model (no dataset)")

print()

# Train Revenue Model
if retail_exists:
    print("[4/4] Training Revenue Model...")
    try:
        df = pd.read_csv("data/online_retail.csv", encoding='ISO-8859-1')
        df = df[df['Quantity'] > 0]
        df = df[df['UnitPrice'] > 0]
        df['TotalPrice'] = df['Quantity'] * df['UnitPrice']
        df['InvoiceDate'] = pd.to_datetime(df['InvoiceDate'])
        
        daily_revenue = df.groupby(df['InvoiceDate'].dt.date)['TotalPrice'].sum().reset_index()
        daily_revenue.columns = ['date', 'revenue']
        daily_revenue = daily_revenue.sort_values('date')
        
        revenue_model = RevenueForecaster()
        training_data = {
            'dates': daily_revenue['date'].astype(str).tolist(),
            'revenues': daily_revenue['revenue'].tolist()
        }
        revenue_model.train(training_data)
        
        print(f"  ✓ Trained on {len(daily_revenue)} days")
        print(f"  ✓ Avg revenue: ${daily_revenue['revenue'].mean():.2f}")
    except Exception as e:
        print(f"  ✗ Error: {e}")
else:
    print("[4/4] Skipping Revenue Model (no dataset)")

print()
print("=" * 60)
print("Training Complete!")
print("=" * 60)
print()
print("Models saved to: ml-service/models/saved/")
print()
print("Next steps:")
print("  1. Start ML service: python start.py")
print("  2. Test predictions: python test_service.py")
print()
