"""
Download Kaggle datasets for ML training
This script helps download datasets without Kaggle CLI
"""

import os
import sys

print("=" * 70)
print("Kaggle Dataset Download Helper")
print("=" * 70)
print()

# Check if data directory exists
if not os.path.exists("data"):
    os.makedirs("data")
    print("✓ Created data directory")

print("To train models with real data, you need to download 2 datasets:")
print()

# Dataset 1: Telco Churn
print("-" * 70)
print("DATASET 1: Telco Customer Churn")
print("-" * 70)
print("URL: https://www.kaggle.com/datasets/blastchar/telco-customer-churn")
print()
print("Steps:")
print("  1. Open the URL above in your browser")
print("  2. Click the 'Download' button (no account needed for this dataset)")
print("  3. Extract the ZIP file")
print("  4. Find: WA_Fn-UseC_-Telco-Customer-Churn.csv")
print("  5. Copy it to: ml-service\\data\\telco_churn.csv")
print()

if os.path.exists("data/telco_churn.csv"):
    print("✓ STATUS: Telco Churn dataset FOUND!")
    # Check file size
    size_mb = os.path.getsize("data/telco_churn.csv") / (1024 * 1024)
    print(f"  File size: {size_mb:.2f} MB")
else:
    print("✗ STATUS: Telco Churn dataset NOT FOUND")
    print("  Expected location: ml-service\\data\\telco_churn.csv")

print()

# Dataset 2: Online Retail
print("-" * 70)
print("DATASET 2: Online Retail")
print("-" * 70)
print("URL: https://www.kaggle.com/datasets/vijayuv/onlineretail")
print()
print("Steps:")
print("  1. Open the URL above in your browser")
print("  2. Click the 'Download' button")
print("  3. Extract the ZIP file")
print("  4. Find: OnlineRetail.csv")
print("  5. Copy it to: ml-service\\data\\online_retail.csv")
print()

if os.path.exists("data/online_retail.csv"):
    print("✓ STATUS: Online Retail dataset FOUND!")
    # Check file size
    size_mb = os.path.getsize("data/online_retail.csv") / (1024 * 1024)
    print(f"  File size: {size_mb:.2f} MB")
else:
    print("✗ STATUS: Online Retail dataset NOT FOUND")
    print("  Expected location: ml-service\\data\\online_retail.csv")

print()
print("=" * 70)

# Check if both datasets are ready
telco_ready = os.path.exists("data/telco_churn.csv")
retail_ready = os.path.exists("data/online_retail.csv")

if telco_ready and retail_ready:
    print("✓ ALL DATASETS READY!")
    print()
    print("Next step: Run training script")
    print("  python train_with_kaggle_data.py")
    print()
elif telco_ready or retail_ready:
    print("⚠ PARTIAL: Some datasets found")
    print()
    print("The training script will:")
    if telco_ready:
        print("  ✓ Train Churn & Anomaly models with real data")
    else:
        print("  ✗ Use synthetic data for Churn & Anomaly models")
    
    if retail_ready:
        print("  ✓ Train CLV & Revenue models with real data")
    else:
        print("  ✗ Use synthetic data for CLV & Revenue models")
    print()
    print("You can still run: python train_with_kaggle_data.py")
    print()
else:
    print("✗ NO DATASETS FOUND")
    print()
    print("Please download the datasets using the URLs above.")
    print("The training script will use synthetic data if datasets are missing.")
    print()

print("=" * 70)
print()

# Try to open URLs in browser
try:
    import webbrowser
    
    response = input("Open dataset URLs in browser? (y/n): ").strip().lower()
    if response == 'y':
        print()
        print("Opening Telco Churn dataset...")
        webbrowser.open("https://www.kaggle.com/datasets/blastchar/telco-customer-churn")
        
        print("Opening Online Retail dataset...")
        webbrowser.open("https://www.kaggle.com/datasets/vijayuv/onlineretail")
        
        print()
        print("✓ Opened URLs in your browser")
        print("  Download the datasets and place them in ml-service\\data\\")
        print()
except:
    pass

print("After downloading, run: python train_with_kaggle_data.py")
print()
