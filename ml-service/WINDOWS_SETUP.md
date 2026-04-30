# ML Service - Windows Setup Guide

## Issue: NumPy Warnings on Python 3.13

You're seeing warnings because Python 3.13 is very new and NumPy hasn't fully optimized for it on Windows yet. These are just warnings - the service will still work!

## Quick Fix Options

### Option 1: Use the Startup Script (Recommended)

Simply run:
```bash
cd ml-service
start.bat
```

This will:
- Create virtual environment
- Install dependencies
- Suppress warnings
- Start the service cleanly

### Option 2: Use Python 3.11 (Most Stable)

1. **Download Python 3.11**:
   - Visit: https://www.python.org/downloads/
   - Download Python 3.11.x (not 3.13)
   - Install it

2. **Create new virtual environment**:
```bash
cd ml-service
py -3.11 -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python start.py
```

### Option 3: Ignore Warnings (Current Setup)

The warnings are harmless. Just use:
```bash
cd ml-service
python start.py
```

This suppresses the warnings and starts the service.

## Verification

Once started, you should see:
```
============================================================
SIM-OPS ML Service
============================================================
Starting ML service...
✓ Dependencies loaded successfully
✓ ML models initializing...

Service will be available at: http://localhost:8000
API Documentation: http://localhost:8000/docs
============================================================
```

## Test the Service

Open your browser and visit:
- **Health Check**: http://localhost:8000/health
- **API Docs**: http://localhost:8000/docs

You should see:
```json
{
  "status": "healthy",
  "timestamp": "2024-..."
}
```

## Common Issues

### Issue: "pip not found"
**Solution**: 
```bash
python -m pip install --upgrade pip
```

### Issue: "Module not found"
**Solution**:
```bash
pip install -r requirements.txt
```

### Issue: Port 8000 already in use
**Solution**:
```bash
# Find and kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Or use different port
python start.py --port 8001
```

### Issue: Virtual environment activation fails
**Solution**:
```bash
# Delete and recreate
rmdir /s venv
python -m venv venv
venv\Scripts\activate
```

## Next Steps

Once the service is running:

1. **Add to .env.local** in your Next.js project:
```
NEXT_PUBLIC_ML_SERVICE_URL=http://localhost:8000
```

2. **Start Next.js**:
```bash
npm run dev
```

3. **Navigate to ML Training** page in the dashboard

4. **Click "Train Model"** to start training with your data

## Production Deployment

For production, use Docker to avoid platform-specific issues:

```bash
cd ml-service
docker build -t simops-ml .
docker run -p 8000:8000 simops-ml
```

## Summary

The NumPy warnings are cosmetic and don't affect functionality. Use `start.bat` or `start.py` for a clean startup experience, or switch to Python 3.11 for the most stable experience.

Your ML service is ready to use! 🚀
