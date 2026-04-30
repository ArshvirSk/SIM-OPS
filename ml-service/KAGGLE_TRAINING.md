# Train Models with Real Kaggle Data

This guide shows you how to train your ML models with real, production-quality datasets from Kaggle.

## Why Use Kaggle Datasets?

- ✅ Real customer behavior patterns
- ✅ Thousands of samples for accurate training
- ✅ Industry-standard benchmarks
- ✅ Better predictions than synthetic data
- ✅ Free and publicly available

## Quick Start (3 Steps)

### Step 1: Install Kaggle CLI (Optional)

If you want to download datasets automatically:

```bash
pip install kaggle
```

Then configure your Kaggle API credentials:
1. Go to https://www.kaggle.com/settings
2. Click "Create New API Token"
3. Save `kaggle.json` to `~/.kaggle/` (Linux/Mac) or `C:\Users\<username>\.kaggle\` (Windows)

### Step 2: Download Datasets

You have two options:

#### Option A: Manual Download (Recommended for Windows)

**Churn Dataset:**
1. Visit: https://www.kaggle.com/datasets/blastchar/telco-customer-churn
2. Click "Download" button
3. Extract `WA_Fn-UseC_-Telco-Customer-Churn.csv`
4. Save to: `ml-service/data/telco_churn.csv`

**CLV Dataset:**
1. Visit: https://www.kaggle.com/datasets/vijayuv/onlineretail
2. Click "Download" button
3. Extract `OnlineRetail.csv`
4. Save to: `ml-service/data/online_retail.csv`

#### Option B: Automatic Download (If Kaggle CLI installed)

```bash
cd ml-service
mkdir data

# Download Telco Churn dataset
kaggle datasets download -d blastchar/telco-customer-churn
unzip telco-customer-churn.zip -d data/
mv data/WA_Fn-UseC_-Telco-Customer-Churn.csv data/telco_churn.csv

# Download Online Retail dataset
kaggle datasets download -d vijayuv/onlineretail
unzip onlineretail.zip -d data/
mv data/OnlineRetail.csv data/online_retail.csv
```

### Step 3: Train Models

```bash
cd ml-service
python train_with_kaggle_data.py
```

The script will:
- ✅ Load datasets
- ✅ Engineer features
- ✅ Train all 4 models
- ✅ Calculate accuracy metrics
- ✅ Save trained models

## Expected Results

### Churn Model
- **Dataset:** 7,043 telecom customers
- **Features:** Contract type, tenure, charges, services
- **Expected Accuracy:** 75-85%
- **Training Time:** ~30 seconds

### CLV Model
- **Dataset:** 541,909 transactions from 4,372 customers
- **Features:** Purchase history, frequency, recency
- **Expected R² Score:** 60-75%
- **Training Time:** ~2 minutes

### Anomaly Detector
- **Dataset:** Monthly charges from telecom customers
- **Features:** Normal spending patterns
- **Training Time:** ~10 seconds

### Revenue Forecaster
- **Dataset:** Daily revenue from online retail
- **Features:** Historical revenue trends
- **Training Time:** ~20 seconds

## What Gets Trained

### 1. Churn Predictor
Maps Telco dataset features to your model:
- Contract type → usage_frequency
- Tenure → contract_length_days
- Tech support → support_tickets proxy
- Payment method → payment_failures proxy
- Total charges → total_spend

### 2. CLV Predictor
Aggregates transaction data per customer:
- Invoice count → total_purchases
- Total spend → CLV label
- Purchase frequency → calculated from dates
- Customer age → days between first and last purchase

### 3. Anomaly Detector
Learns normal patterns from:
- Monthly charges distribution
- Identifies outliers in spending

### 4. Revenue Forecaster
Learns trends from:
- Daily aggregated revenue
- Time series patterns

## Verify Training

After training, test the models:

```bash
python test_service.py
```

Or test via API:

```bash
# Start service
python start.py

# In another terminal, test prediction
curl -X POST http://localhost:8000/predict/churn \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "test_123",
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
  }'
```

## Troubleshooting

### "Dataset not found"
- Make sure files are in `ml-service/data/` folder
- Check file names match exactly:
  - `telco_churn.csv`
  - `online_retail.csv`

### "Module not found"
```bash
pip install pandas numpy scikit-learn
```

### "Permission denied" (Kaggle CLI)
- Check `kaggle.json` is in correct location
- On Linux/Mac: `chmod 600 ~/.kaggle/kaggle.json`

### Training takes too long
- CLV dataset is large (500k+ rows)
- Expected: 2-3 minutes on modern hardware
- Can reduce dataset size by sampling

## Alternative: Use Synthetic Data

If you can't download Kaggle datasets, the models will automatically fall back to synthetic data. This works for demos but won't be as accurate.

## Next Steps

After training:

1. ✅ Models are saved to `ml-service/models/saved/`
2. ✅ Start ML service: `python start.py`
3. ✅ Integrate with Next.js app (see spec)
4. ✅ Retrain periodically with fresh data

## Retraining

To retrain models:

```bash
# Delete old models
rm -rf ml-service/models/saved/*.pkl

# Run training again
python train_with_kaggle_data.py
```

Or retrain via API:

```bash
POST http://localhost:8000/models/train/churn
Content-Type: application/json

{
  "features": [[...], [...]],
  "labels": [0, 1, 0, ...]
}
```

## Dataset Details

### Telco Customer Churn
- **Source:** IBM Sample Data
- **Size:** 7,043 customers
- **Features:** 20 columns
- **Target:** Churn (Yes/No)
- **License:** Public Domain
- **Use Case:** Predict customer churn in telecom

### Online Retail
- **Source:** UCI Machine Learning Repository
- **Size:** 541,909 transactions
- **Customers:** 4,372 unique
- **Period:** Dec 2010 - Dec 2011
- **License:** Public Domain
- **Use Case:** CLV prediction, revenue forecasting

## Benefits of Real Data

**Before (Synthetic Data):**
- Random patterns
- No real insights
- Poor accuracy
- Generic recommendations

**After (Kaggle Data):**
- Real customer behavior
- Actionable insights
- 75-85% accuracy
- Relevant recommendations

---

**Ready to train?** Run `python train_with_kaggle_data.py` and watch your models learn from real data!
