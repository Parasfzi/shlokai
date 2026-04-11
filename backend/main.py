"""
ShlokAI — FastAPI Backend v2.0
Enhanced with controlled AI layers (Query Enhancement, Smart Ranking, Explain Mode).
Core principle: FAISS retrieval is always first. AI only assists — never generates.
"""

from dotenv import load_dotenv
load_dotenv()  # Load OPENROUTER_API_KEY from .env

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Literal
from contextlib import asynccontextmanager
from datetime import datetime
import random

from search_engine import GitaSearchEngine
from ai_layers import enhance_query, smart_rank, explain_verse
from database import init_db, get_db
import sqlite3
from auth import hash_password, verify_password, create_access_token, get_current_user_id

from search_engine import GitaSearchEngine
from ai_layers import enhance_query, smart_rank, explain_verse


import asyncio

# ─── Startup: load engine once ───────────────────────────────────────────────
engine: Optional[GitaSearchEngine] = None
engine_status = "loading"

async def background_load_engine():
    global engine, engine_status
    try:
        print("Waiting 5 seconds for Uvicorn to bind port before loading AI...", flush=True)
        # Yield control back to Uvicorn event loop so it can bind the TCP port NOW.
        # This prevents Render from timing out due to Python's GIL blocking the port bind!
        await asyncio.sleep(5)
        
        print("Initializing AI Models and FAISS in background...", flush=True)
        # Run synchronous blocking CPU/IO code in a thread
        engine = await asyncio.to_thread(GitaSearchEngine)
        engine_status = "ready"
        print("Engine fully loaded and ready!", flush=True)
    except Exception as e:
        engine_status = f"error: {str(e)}"
        print(f"FAILED to load engine: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize the database and user tables
    init_db()
    print("=" * 50)
    print("  ShlokAI v2 — Starting up...")
    print("=" * 50)
    
    # Start engine load in background so port binds immediately (avoiding Render timeout)
    asyncio.create_task(background_load_engine())
    yield
    print("Shutting down...")


# ─── App ─────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="ShlokAI",
    description=(
        "Sacred Knowledge Search Engine — "
        "Pure retrieval from Bhagavad Gita with controlled AI assistance."
    ),
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "http://192.168.1.2:5173", # LAN Local testing
        "https://shlokai.vercel.app"
    ], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Auth Schemas ────────────────────────────────────────────────────────────
class UserAuth(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: int

class BookmarkCreate(BaseModel):
    chapter: int
    verse: int

class BookmarkResponse(BaseModel):
    id: int
    chapter: int
    verse: int
    sanskrit: str
    translation: str
    hindi_translation: str

# ─── Search Request / Response Schemas ───────────────────────────────────────
class SearchRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=500, description="User's search query")
    mode: Literal["pure", "explain"] = Field(
        default="pure",
        description=(
            "'pure' → returns only the retrieved verse. "
            "'explain' → adds a Hinglish explanation grounded in the verse."
        )
    )
    top_k: int = Field(default=5, ge=1, le=20, description="FAISS candidates to retrieve")
    enhance: bool = Field(
        default=True,
        description="If True, AI expands your query for better semantic matching."
    )
    smart_rank: bool = Field(
        default=True,
        description="If True, AI picks the single best verse from FAISS results."
    )


class VerseResult(BaseModel):
    chapter: int
    verse: int
    sanskrit: str
    translation: str
    hindi_translation: Optional[str] = None   # Hindi translation (Swami Tejomayananda)
    explanation: Optional[str] = None          # Only present in explain mode
    score: float                               # Relevance score (0–1)


class SearchResponse(BaseModel):
    original_query: str
    enhanced_query: Optional[str] = None   # Shows what AI sent to FAISS
    mode: str
    result: Optional[VerseResult] = None  # Best single verse
    all_results: Optional[List[VerseResult]] = None  # All FAISS candidates (debug)
    message: str


# ─── POST /search ─────────────────────────────────────────────────────────────
@app.post("/search", response_model=SearchResponse)
async def search_verses(request: SearchRequest):
    """
    Main search endpoint.
    """
    if engine is None:
        raise HTTPException(
            status_code=503, 
            detail=f"Engine is currently {engine_status}. Please wait a moment and try again."
        )

    original_query = request.text.strip()
    enhanced = original_query  # default: no enhancement

    # ── Layer 1: Query Enhancement ────────────────────────────────────────────
    if request.enhance:
        enhanced = await enhance_query(original_query)

    # ── FAISS Search ──────────────────────────────────────────────────────────
    raw_results = engine.search(query=enhanced, top_k=request.top_k)

    if not raw_results:
        return SearchResponse(
            original_query=original_query,
            enhanced_query=enhanced if request.enhance else None,
            mode=request.mode,
            result=None,
            message="No relevant shlok found."
        )

    # ── Layer 2: Smart Ranking ────────────────────────────────────────────────
    if request.smart_rank and len(raw_results) > 1:
        best_verse = await smart_rank(original_query, raw_results)
    else:
        best_verse = raw_results[0]  # Highest FAISS score

    # ── Layer 3: Explain Mode ─────────────────────────────────────────────────
    explanation = None
    if request.mode == "explain":
        explanation = await explain_verse(best_verse)

    # ── Build response ────────────────────────────────────────────────────────
    result = VerseResult(
        chapter=best_verse["chapter"],
        verse=best_verse["verse"],
        sanskrit=best_verse["sanskrit"],
        translation=best_verse["translation"],
        hindi_translation=best_verse.get("hindi_translation", ""),
        explanation=explanation,
        score=best_verse["score"],
    )

    all_candidates = [
        VerseResult(
            chapter=v["chapter"],
            verse=v["verse"],
            sanskrit=v["sanskrit"],
            translation=v["translation"],
            hindi_translation=v.get("hindi_translation", ""),
            score=v["score"],
        )
        for v in raw_results
    ]

    return SearchResponse(
        original_query=original_query,
        enhanced_query=enhanced if request.enhance else None,
        mode=request.mode,
        result=result,
        all_results=all_candidates,
        message=(
            f"Found {len(raw_results)} candidate(s). "
            f"Best match: Chapter {result.chapter}, Verse {result.verse}."
        ),
    )


# ─── GET /health ──────────────────────────────────────────────────────────────
@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "version": "2.0.0",
        "engine_ready": engine is not None,
        "engine_status": engine_status,
        "verses_indexed": len(engine.data) if engine else 0,
        "ai_layers": ["query_enhancement", "smart_ranking", "explain_mode"],
    }

# ─── AUTHENTICATION ENDPOINTS ─────────────────────────────────────────────────
@app.post("/register", response_model=TokenResponse)
async def register_user(user: UserAuth, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (user.email,))
    if cursor.fetchone():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    pwd_hash = hash_password(user.password)
    cursor.execute(
        "INSERT INTO users (email, password_hash) VALUES (?, ?)",
        (user.email, pwd_hash)
    )
    db.commit()
    user_id = cursor.lastrowid
    
    access_token = create_access_token(data={"sub": str(user_id)})
    return {"access_token": access_token, "token_type": "bearer", "user_id": user_id}

@app.post("/login", response_model=TokenResponse)
async def login_user(user: UserAuth, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT id, password_hash FROM users WHERE email = ?", (user.email,))
    row = cursor.fetchone()
    
    if not row or not verify_password(row["password_hash"], user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        
    access_token = create_access_token(data={"sub": str(row["id"])})
    return {"access_token": access_token, "token_type": "bearer", "user_id": row["id"]}


# ─── BOOKMARK ENDPOINTS ───────────────────────────────────────────────────────
@app.post("/bookmarks")
async def add_bookmark(
    bookmark: BookmarkCreate, 
    user_id: int = Depends(get_current_user_id),
    db: sqlite3.Connection = Depends(get_db)
):
    if engine is None:
        raise HTTPException(status_code=503, detail="Search engine is still loading. Please try again in a moment.")
    # Verify verse exists in DB
    found = next((v for v in engine.data if v["chapter"] == bookmark.chapter and v["verse"] == bookmark.verse), None)
    if not found:
        raise HTTPException(status_code=404, detail="Verse not found in Gita")
        
    try:
        cursor = db.cursor()
        cursor.execute(
            "INSERT INTO bookmarks (user_id, chapter, verse) VALUES (?, ?, ?)",
            (user_id, bookmark.chapter, bookmark.verse)
        )
        db.commit()
        return {"status": "success", "message": "Bookmark added"}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Verse already bookmarked")


@app.get("/bookmarks", response_model=List[BookmarkResponse])
async def get_bookmarks(
    user_id: int = Depends(get_current_user_id),
    db: sqlite3.Connection = Depends(get_db)
):
    cursor = db.cursor()
    cursor.execute("SELECT id, chapter, verse FROM bookmarks WHERE user_id = ? ORDER BY added_at DESC", (user_id,))
    rows = cursor.fetchall()
    
    results = []
    # Map DB constraints to actual verse text (will skip translation if engine is still loading)
    for row in rows:
        ch, v_num = row["chapter"], row["verse"]
        verse = next((v for v in engine.data if v["chapter"] == ch and v["verse"] == v_num), None) if engine else None
        if verse:
            results.append(BookmarkResponse(
                id=row["id"],
                chapter=verse["chapter"],
                verse=verse["verse"],
                sanskrit=verse["sanskrit"],
                translation=verse["translation"],
                hindi_translation=verse.get("hindi_translation", "")
            ))
            
    return results

@app.delete("/bookmarks/{chapter}/{verse}")
async def remove_bookmark(
    chapter: int, 
    verse: int, 
    user_id: int = Depends(get_current_user_id),
    db: sqlite3.Connection = Depends(get_db)
):
    cursor = db.cursor()
    cursor.execute("DELETE FROM bookmarks WHERE user_id = ? AND chapter = ? AND verse = ?", (user_id, chapter, verse))
    db.commit()
    return {"status": "success", "message": "Bookmark removed"}


# ─── DAILY SHLOK ──────────────────────────────────────────────────────────────
@app.get("/daily_shlok", response_model=VerseResult)
async def get_daily_shlok():
    """
    Returns a deterministic Shlok based on today's date.
    Everyone sees the same Shlok of the Day.
    """
    # Use current day (YYYY-MM-DD) as seed
    seed = datetime.now().strftime("%Y-%m-%d")
    r = random.Random(seed)
    
    # Pick a random verse from all available
    if not engine or not engine.data:
        raise HTTPException(status_code=503, detail="Search engine not loaded")
        
    idx = r.randint(0, len(engine.data) - 1)
    verse = engine.data[idx]
    
    return VerseResult(
        chapter=verse["chapter"],
        verse=verse["verse"],
        sanskrit=verse["sanskrit"],
        translation=verse["translation"],
        hindi_translation=verse.get("hindi_translation", ""),
        score=1.0
    )
