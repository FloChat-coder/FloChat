import os
import psycopg2
import logging

def get_db_connection():
    DB_URL = os.getenv("DATABASE_URL")
    try:
        return psycopg2.connect(DB_URL)
    except Exception as e:
        logging.error(f"❌ DB Connection Failed: {e}")
        return None