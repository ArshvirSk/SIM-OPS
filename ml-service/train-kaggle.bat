@echo off
echo ============================================================
echo Train ML Models with Kaggle Data
echo ============================================================
echo.

REM Create data directory
if not exist "data" mkdir data

echo Checking for datasets...
echo.

REM Check for Telco Churn dataset
if exist "data\telco_churn.csv" (
    echo [OK] Telco Churn dataset found
) else (
    echo [!] Telco Churn dataset NOT found
    echo.
    echo Please download manually:
    echo 1. Visit: https://www.kaggle.com/datasets/blastchar/telco-customer-churn
    echo 2. Download and extract WA_Fn-UseC_-Telco-Customer-Churn.csv
    echo 3. Save to: ml-service\data\telco_churn.csv
    echo.
)

REM Check for Online Retail dataset
if exist "data\online_retail.csv" (
    echo [OK] Online Retail dataset found
) else (
    echo [!] Online Retail dataset NOT found
    echo.
    echo Please download manually:
    echo 1. Visit: https://www.kaggle.com/datasets/vijayuv/onlineretail
    echo 2. Download and extract OnlineRetail.csv
    echo 3. Save to: ml-service\data\online_retail.csv
    echo.
)

echo.
echo ============================================================
echo Starting Training...
echo ============================================================
echo.

REM Activate virtual environment if it exists
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
)

REM Run training script
python train_with_kaggle_data.py

echo.
echo ============================================================
echo Training Complete!
echo ============================================================
echo.
echo Models saved to: ml-service\models\saved\
echo.
echo Next steps:
echo   1. Start ML service: start.bat
echo   2. Test predictions: python test_service.py
echo.

pause
