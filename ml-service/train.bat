@echo off
setlocal

REM Suppress Python warnings
set PYTHONWARNINGS=ignore

echo ============================================================
echo Training ML Models with Kaggle Data
echo ============================================================
echo.

REM Activate venv if exists
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
)

REM Run training with warnings suppressed
python -W ignore train_models.py

echo.
pause
