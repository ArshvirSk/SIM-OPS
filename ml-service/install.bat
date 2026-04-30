@echo off
echo ============================================================
echo Installing ML Service Dependencies
echo ============================================================
echo.
echo This will install packages to your global Python installation.
echo.
pause

echo Installing core packages...
python -m pip install --upgrade pip
python -m pip install fastapi uvicorn pydantic python-multipart python-dotenv requests joblib

echo.
echo Installing ML packages (may take 2-3 minutes)...
python -m pip install numpy pandas scikit-learn

echo.
echo ============================================================
echo Installation Complete!
echo ============================================================
echo.
echo To start the service, run:
echo   python start.py
echo.
pause
