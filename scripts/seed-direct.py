import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables from .env.local
load_dotenv(dotenv_path=".env.local")

db_url = os.getenv("DATABASE_URL")
if not db_url:
    print("Error: DATABASE_URL not found in .env.local")
    exit(1)

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    # Create a test customer
    cur.execute(
        """
        INSERT INTO customers (id, email, name, status, feature_usage_rate, engagement_score, total_spend, last_activity)
        VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
        ON CONFLICT (id) DO NOTHING
    """,
        ("cust_demo_123", "demo_user@example.com", "Demo User", "active", 0.85, 90, 0),
    )

    # Create a sample transaction
    cur.execute(
        """
        INSERT INTO transactions (customer_id, amount, status, description)
        VALUES (%s, %s, %s, %s)
    """,
        ("cust_demo_123", 49.99, "completed", "Standard Plan Signup"),
    )

    conn.commit()
    print("✓ Successfully seeded demo customer via direct SQL.")
    cur.close()
    conn.close()
except Exception as e:
    print(f"✗ Failed to seed database: {e}")
