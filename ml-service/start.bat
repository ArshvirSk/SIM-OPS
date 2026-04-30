@echo off
echo ============================================================
echo SIM-OPS ML Service - Windows Startup
echo ============================================================
echo.

REM Check if virtual environment exists
if not exist "venv\" (
    echo Creating virtual environment...
    python -m venv venv
    echo.
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Upgrade pip first
echo.
echo Upgrading pip...
python -m pip install --upgrade pip

REM Install dependencies one by one to avoid build issues
echo.
echo Installing core dependencies...
pip install fastapi uvicorn pydantic python-multipart python-dotenv requests joblib

echo.
echo Installing ML libraries (this may take a moment)...
pip install numpy pandas scikit-learn

REM Start the service
echo.
echo Starting ML service...
echo.
python start.py

pause
