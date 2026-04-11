"""
ShlokAI — SQLite Database Configuration
Handles user accounts and bookmarks.
"""

import sqlite3
import os
from contextlib import contextmanager
from typing import Generator

# Put DB file in the backend directory
DB_PATH = os.path.join(os.path.dirname(__file__), 'users.db')

def init_db():
    """Create the users and bookmarks tables if they don't exist."""
    print(f"[DB] Initializing database at {DB_PATH}")
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    try:
        cursor = conn.cursor()
        
        # User table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Bookmarks table
        # We store chapter and verse to dynamically fetch from FAISS later
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS bookmarks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                chapter INTEGER NOT NULL,
                verse INTEGER NOT NULL,
                added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                UNIQUE(user_id, chapter, verse)
            )
        ''')
        conn.commit()
    finally:
        conn.close()

def get_db() -> Generator[sqlite3.Connection, None, None]:
    """FastAPI Dependency for getting a database connection."""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row  # Returns dict-like rows instead of tuples
    try:
        yield conn
    finally:
        conn.close()
