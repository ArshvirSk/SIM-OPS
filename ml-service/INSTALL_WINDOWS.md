# Windows Installation Guide - Simple Method

## The Problem
scikit-learn requires C++ build tools on Windows, which is a hassle to install.

## The Solution
Install packages globally (no virtual environment needed for development).

## Step-by-Step Installation

### Step 1: Run the Installer
```bash
cd ml-service
install.bat
```

This will:
- Upgrade pip
- Install FastAPI and dependencies
- Install NumPy, Pandas, scikit-learn (pre-built wheels)

**Time**: 2-3 minutes

### Step 2: Start the Service
```bash
python start.py
```

You should see:
```
============================================================
SIM-OPS ML Service
============================================================
✓ Dependencies loaded successfully
✓ ML models initializing...

Service will be available at: http://localhost:8000
```

### Step 3: Test It
Open browser: http://localhost:8000/health

Should see:
```json
{"status": "healthy", "timestamp": "..."}
```

## Alternative: Manual Installation

If the batch file doesn't work, install manually:

```bash
cd ml-service

# Install one by one
python -m pip install fastapi
python -m pip install uvicorn
python -m pip install pydantic
python -m pip install python-multipart
python -m pip install python-dotenv
python -m pip install requests
python -m pip install joblib
python -m pip install numpy
python -m pip install pandas
python -m pip install scikit-learn

# Start service
python start.py
```

## If You Still Get Errors

### Option 1: Use Conda (Recommended for Windows)

1. **Install Miniconda**: https://docs.conda.io/en/latest/miniconda.html

2. **Create environment**:
```bash
conda create -n simops python=3.11
conda activate simops
```

3. **Install packages**:
```bash
conda install -c conda-forge fastapi uvicorn scikit-learn pandas numpy
pip install pydantic python-multipart python-dotenv requests joblib
```

4. **Start service**:
```bash
python start.py
```

### Option 2: Use Docker (No Python Setup Needed)

1. **Install Docker Desktop**: https://www.docker.com/products/docker-desktop/

2. **Build and run**:
```bash
cd ml-service
docker build -t simops-ml .
docker run -p 8000:8000 simops-ml
```

3. **Access**: http://localhost:8000/health

### Option 3: Use Pre-built Binary (Coming Soon)

We can provide a standalone executable that doesn't require Python installation.

## Verification

Once installed and running:

1. **Health Check**: http://localhost:8000/health ✓
2. **API Docs**: http://localhost:8000/docs ✓
3. **Test Script**: `python test_service.py` ✓

## Next Steps

1. ✅ ML service running
2. ✅ Add to .env.local: `NEXT_PUBLIC_ML_SERVICE_URL=http://localhost:8000`
3. ✅ Start Next.js: `npm run dev`
4. ✅ Navigate to ML Training page
5. ✅ Train models with your data

## Common Issues

### "python not found"
- Add Python to PATH
- Or use full path: `C:\Python311\python.exe start.py`

### "pip not found"
```bash
python -m ensurepip
python -m pip install --upgrade pip
```

### Packages install but service won't start
```bash
# Check what's installed
pip list

# Reinstall if needed
pip uninstall fastapi uvicorn -y
pip install fastapi uvicorn
```

### Port 8000 in use
```bash
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

## Summary

**Easiest Path**:
1. Run `install.bat`
2. Run `python start.py`
3. Open http://localhost:8000/health

**If that fails**:
- Try Conda (Option 1)
- Try Docker (Option 2)
- Install packages manually

The ML service will work once the packages are installed! 🚀
