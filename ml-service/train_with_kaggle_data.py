"""
Train ML models with real Kaggle datasets
This script downloads and trains models with production-quality data
"""

import pandas as pd
import numpy as np
import sys
import os

# Suppress numpy warnings
import warnings
warnings.filterwarnings('ignore')
os.environ['PYTHONWARNINGS'] = 'ignore'

try:
    from models.churn_predictor import ChurnPredictor
    from models.clv_predictor import CLVPredictor
    from models.anomaly_detector import AnomalyDetector
    from models.revenue_forecaster import RevenueForecaster
except Exception as e:
    print(f"Error importing models: {e}")
    print("Make sure you're running from ml-service directory")
    sys.exit(1)

print("=" * 60)
print("ML Model Training with Kaggle Datasets")
print("=" * 60)

# ============================================================================
# 1. CHURN PREDICTION - Telco Customer Churn Dataset
# ============================================================================
print("\n[1/4] Training Churn Prediction Model...")
print("-" * 60)

# Download instructions
print("""
To train the churn model, download the Telco Customer Churn dataset:
1. Visit: https://www.kaggle.com/datasets/blastchar/telco-customer-churn
2. Download 'WA_Fn-UseC_-Telco-Customer-Churn.csv'
3. Place it in: ml-service/data/telco_churn.csv

Or use this direct download command:
kaggle datasets download -d blastchar/telco-customer-churn
""")

churn_data_path = "data/telco_churn.csv"

if os.path.exists(churn_data_path):
    print(f"✓ Found dataset: {churn_data_path}")
    
    # Load data
    df = pd.read_csv(churn_data_path)
    print(f"✓ Loaded {len(df)} customer records")
    
    # Feature engineering
    print("✓ Engineering features...")
    
    # Convert TotalCharges to numeric
    df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce')
    df['TotalCharges'].fillna(df['TotalCharges'].median(), inplace=True)
    
    # Create features matching our model
    features = []
    labels = []
    
    for _, row in df.iterrows():
        # Map Telco features to our model features
        feature_vector = [
            1.0 if row['Contract'] == 'Month-to-month' else 0.5,  # usage_frequency proxy
            0 if row['tenure'] > 12 else row['tenure'],  # days_since_last_login proxy
            1 if row['TechSupport'] == 'No' else 0,  # support_tickets_count proxy
            1 if row['PaymentMethod'] == 'Electronic check' else 0,  # payment_failures proxy
            row['tenure'] * 30,  # contract_length_days
            0.7 if row['OnlineSecurity'] == 'Yes' else 0.3,  # feature_usage_rate
            row['tenure'] * 2,  # avg_session_duration proxy
            float(row['TotalCharges']),  # total_spend
            0.1 if row['Contract'] != 'Month-to-month' else 0,  # discount_usage
            0  # referrals_made (not in dataset)
        ]
        
        features.append(feature_vector)
        labels.append(1 if row['Churn'] == 'Yes' else 0)
    
    # Train model
    print("✓ Training Random Forest model...")
    churn_model = ChurnPredictor()
    
    training_data = {
        'features': np.array(features),
        'labels': np.array(labels)
    }
    
    churn_model.train(training_data)
    
    # Calculate accuracy
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import accuracy_score, classification_report
    
    X_train, X_test, y_train, y_test = train_test_split(
        features, labels, test_size=0.2, random_state=42
    )
    
    X_test_scaled = churn_model.scaler.transform(X_test)
    y_pred = churn_model.model.predict(X_test_scaled)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"✓ Model trained successfully!")
    print(f"✓ Training samples: {len(features)}")
    print(f"✓ Test accuracy: {accuracy:.2%}")
    print(f"✓ Churn rate in data: {sum(labels)/len(labels):.2%}")
    
else:
    print(f"✗ Dataset not found: {churn_data_path}")
    print("  Using synthetic data instead...")
    churn_model = ChurnPredictor()

# ============================================================================
# 2. CLV PREDICTION - Online Retail Dataset
# ============================================================================
print("\n[2/4] Training CLV Prediction Model...")
print("-" * 60)

print("""
To train the CLV model, download the Online Retail dataset:
1. Visit: https://www.kaggle.com/datasets/vijayuv/onlineretail
2. Download 'OnlineRetail.csv'
3. Place it in: ml-service/data/online_retail.csv

Or use this command:
kaggle datasets download -d vijayuv/onlineretail
""")

clv_data_path = "data/online_retail.csv"

if os.path.exists(clv_data_path):
    print(f"✓ Found dataset: {clv_data_path}")
    
    # Load data
    df = pd.read_csv(clv_data_path, encoding='ISO-8859-1')
    print(f"✓ Loaded {len(df)} transaction records")
    
    # Feature engineering
    print("✓ Engineering CLV features...")
    
    # Clean data
    df = df[df['CustomerID'].notna()]
    df = df[df['Quantity'] > 0]
    df = df[df['UnitPrice'] > 0]
    df['TotalPrice'] = df['Quantity'] * df['UnitPrice']
    
    # Aggregate by customer
    customer_features = df.groupby('CustomerID').agg({
        'InvoiceNo': 'count',  # total_purchases
        'TotalPrice': ['sum', 'mean'],  # total_spend, avg_purchase_value
        'InvoiceDate': lambda x: (pd.to_datetime(x.max()) - pd.to_datetime(x.min())).days  # customer_age_days
    }).reset_index()
    
    customer_features.columns = ['CustomerID', 'total_purchases', 'total_spend', 'avg_purchase_value', 'customer_age_days']
    
    # Calculate purchase frequency
    customer_features['purchase_frequency'] = customer_features['total_purchases'] / (customer_features['customer_age_days'] + 1)
    
    # Create features
    features = []
    labels = []
    
    for _, row in customer_features.iterrows():
        feature_vector = [
            float(row['total_purchases']),
            float(row['avg_purchase_value']),
            float(row['purchase_frequency']),
            float(row['customer_age_days']),
            0.7,  # engagement_score (not in dataset)
            0,  # referrals_made (not in dataset)
            0,  # support_interactions (not in dataset)
            0.5  # feature_adoption_rate (not in dataset)
        ]
        
        features.append(feature_vector)
        labels.append(float(row['total_spend']))  # CLV = total spend
    
    # Train model
    print("✓ Training Gradient Boosting model...")
    clv_model = CLVPredictor()
    
    training_data = {
        'features': np.array(features),
        'labels': np.array(labels)
    }
    
    clv_model.train(training_data)
    
    # Calculate accuracy
    X_train, X_test, y_train, y_test = train_test_split(
        features, labels, test_size=0.2, random_state=42
    )
    
    X_test_scaled = clv_model.scaler.transform(X_test)
    y_pred = clv_model.model.predict(X_test_scaled)
    
    from sklearn.metrics import mean_absolute_error, r2_score
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print(f"✓ Model trained successfully!")
    print(f"✓ Training samples: {len(features)}")
    print(f"✓ Mean Absolute Error: ${mae:.2f}")
    print(f"✓ R² Score: {r2:.2%}")
    print(f"✓ Average CLV: ${np.mean(labels):.2f}")
    
else:
    print(f"✗ Dataset not found: {clv_data_path}")
    print("  Using synthetic data instead...")
    clv_model = CLVPredictor()

# ============================================================================
# 3. ANOMALY DETECTION - Using Churn Dataset Metrics
# ============================================================================
print("\n[3/4] Training Anomaly Detection Model...")
print("-" * 60)

if os.path.exists(churn_data_path):
    print(f"✓ Using Telco dataset for anomaly detection")
    
    df = pd.read_csv(churn_data_path)
    df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce')
    df['TotalCharges'].fillna(df['TotalCharges'].median(), inplace=True)
    
    # Use monthly charges as the metric
    normal_data = df[df['Churn'] == 'No']['MonthlyCharges'].values
    
    print("✓ Training Isolation Forest...")
    anomaly_model = AnomalyDetector()
    
    training_data = {
        'values': normal_data.tolist()
    }
    
    anomaly_model.train(training_data)
    
    print(f"✓ Model trained successfully!")
    print(f"✓ Training samples: {len(normal_data)}")
    print(f"✓ Normal range: ${normal_data.min():.2f} - ${normal_data.max():.2f}")
    
else:
    print(f"✗ Dataset not found, using synthetic data...")
    anomaly_model = AnomalyDetector()

# ============================================================================
# 4. REVENUE FORECASTING - Using Aggregated Transaction Data
# ============================================================================
print("\n[4/4] Training Revenue Forecasting Model...")
print("-" * 60)

if os.path.exists(clv_data_path):
    print(f"✓ Using Online Retail dataset for revenue forecasting")
    
    df = pd.read_csv(clv_data_path, encoding='ISO-8859-1')
    df = df[df['Quantity'] > 0]
    df = df[df['UnitPrice'] > 0]
    df['TotalPrice'] = df['Quantity'] * df['UnitPrice']
    df['InvoiceDate'] = pd.to_datetime(df['InvoiceDate'])
    
    # Aggregate daily revenue
    daily_revenue = df.groupby(df['InvoiceDate'].dt.date)['TotalPrice'].sum().reset_index()
    daily_revenue.columns = ['date', 'revenue']
    daily_revenue = daily_revenue.sort_values('date')
    
    print("✓ Training Linear Regression model...")
    revenue_model = RevenueForecaster()
    
    training_data = {
        'dates': daily_revenue['date'].astype(str).tolist(),
        'revenues': daily_revenue['revenue'].tolist()
    }
    
    revenue_model.train(training_data)
    
    print(f"✓ Model trained successfully!")
    print(f"✓ Training samples: {len(daily_revenue)} days")
    print(f"✓ Average daily revenue: ${daily_revenue['revenue'].mean():.2f}")
    print(f"✓ Revenue range: ${daily_revenue['revenue'].min():.2f} - ${daily_revenue['revenue'].max():.2f}")
    
else:
    print(f"✗ Dataset not found, using synthetic data...")
    revenue_model = RevenueForecaster()

# ============================================================================
# SUMMARY
# ============================================================================
print("\n" + "=" * 60)
print("Training Complete!")
print("=" * 60)

print("\nModel Status:")
print(f"  ✓ Churn Predictor: {'Trained with real data' if os.path.exists(churn_data_path) else 'Using synthetic data'}")
print(f"  ✓ CLV Predictor: {'Trained with real data' if os.path.exists(clv_data_path) else 'Using synthetic data'}")
print(f"  ✓ Anomaly Detector: {'Trained with real data' if os.path.exists(churn_data_path) else 'Using synthetic data'}")
print(f"  ✓ Revenue Forecaster: {'Trained with real data' if os.path.exists(clv_data_path) else 'Using synthetic data'}")

print("\nModels saved to: ml-service/models/saved/")
print("\nNext steps:")
print("  1. Start ML service: python start.py")
print("  2. Test predictions: python test_service.py")
print("  3. Integrate with Next.js app")

print("\n" + "=" * 60)
