# ML Service Quick Start

## Current Status
✅ ML Service installed and working  
⚠️ Models trained on synthetic data (not accurate)  
🎯 **Next:** Train with real Kaggle data for 75-85% accuracy

## Train with Real Data (Recommended)

### 1. Download Datasets (5 minutes)

**Churn Dataset:**
- Visit: https://www.kaggle.com/datasets/blastchar/telco-customer-churn
- Download `WA_Fn-UseC_-Telco-Customer-Churn.csv`
- Save to: `ml-service/data/telco_churn.csv`

**CLV Dataset:**
- Visit: https://www.kaggle.com/datasets/vijayuv/onlineretail
- Download `OnlineRetail.csv`
- Save to: `ml-service/data/online_retail.csv`

### 2. Train Models (3 minutes)

```bash
cd ml-service
python train_with_kaggle_data.py
```

### 3. Start Service

```bash
python start.py
```

### 4. Test

```bash
python test_service.py
```

## Or: Use Synthetic Data (Demo Only)

If you just want to test the system:

```bash
cd ml-service
python start.py
```

Models will use synthetic data (predictions won't be accurate).

## What You Get

### With Kaggle Data (Recommended)
- ✅ 75-85% churn prediction accuracy
- ✅ Real customer behavior patterns
- ✅ Actionable insights
- ✅ Production-ready models

### With Synthetic Data (Demo)
- ⚠️ Random predictions
- ⚠️ No real insights
- ⚠️ For testing only

## Files

- `start.py` - Start ML service
- `test_service.py` - Test predictions
- `train_with_kaggle_data.py` - Train with real data
- `train-kaggle.bat` - Windows training script
- `KAGGLE_TRAINING.md` - Detailed training guide

## Need Help?

See `KAGGLE_TRAINING.md` for detailed instructions.
