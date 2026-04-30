"""
Startup script for ML Service
Handles warnings and ensures clean startup
"""

import sys
import os

print("=" * 60)
print("SIM-OPS ML Service")
print("=" * 60)
print("Starting ML service...")
print()

# Import and run the main app
try:
    import uvicorn
    from main import app

    print("✓ Dependencies loaded successfully")
    print("✓ ML models initializing...")
    print()
    print("Service will be available at: http://localhost:8000")
    print("API Documentation: http://localhost:8000/docs")
    print()
    print("Press CTRL+C to stop the service")
    print("=" * 60)
    print()

    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
except KeyboardInterrupt:
    print("\n\nShutting down ML service...")
    sys.exit(0)
except Exception as e:
    print(f"\n[ERROR] Error starting service: {e}")
    print("\nTroubleshooting:")
    print("1. Ensure all dependencies are installed: pip install -r requirements.txt")
    print("2. Check Python version (3.10 or 3.11 recommended)")
    print("3. Try: pip install --upgrade numpy scikit-learn")
    sys.exit(1)
