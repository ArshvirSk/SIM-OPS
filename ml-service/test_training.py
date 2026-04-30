import sys
print("Python version:", sys.version)
print("Starting test...")

try:
    import pandas as pd
    print("✓ pandas imported")
except Exception as e:
    print(f"✗ pandas error: {e}")

try:
    import numpy as np
    print("✓ numpy imported")
except Exception as e:
    print(f"✗ numpy error: {e}")

try:
    from models.churn_predictor import ChurnPredictor
    print("✓ ChurnPredictor imported")
except Exception as e:
    print(f"✗ ChurnPredictor error: {e}")

try:
    import os
    print(f"✓ Current directory: {os.getcwd()}")
    print(f"✓ Data folder exists: {os.path.exists('data')}")
    if os.path.exists('data'):
        files = os.listdir('data')
        print(f"✓ Files in data: {files}")
except Exception as e:
    print(f"✗ File system error: {e}")

print("Test complete!")
