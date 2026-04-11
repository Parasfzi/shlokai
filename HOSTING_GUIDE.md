# 🚀 ShlokAI Hosting Guide

This guide will help you deploy your ShlokAI application to the internet so anyone can access it! 
Since the application has two separate parts (Frontend and Backend), we will host them on two different free/cheap platforms.

## Overview
- **Frontend (React/Vite):** Hosted on **Vercel** or **Netlify** (Free, Super fast for pure UI).
- **Backend (FastAPI/Python):** Hosted on **Render**, **Railway**, or a standard VPS.

---

## Step 1: Prepare the Frontend for Production

Currently, your frontend is hardcoded to talk to `http://localhost:8000`. You need to make this dynamic so it can talk to your future live backend URL.

1. Create a file called `.env` in your `frontend/` folder:
   ```env
   VITE_API_BASE=https://your-backend-url.onrender.com
   ```
2. Open `frontend/src/api.js` and change the very first line:
   ```javascript
   // Change this:
   const API_BASE = 'http://localhost:8000';
   
   // To this:
   const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
   ```

---

## Step 2: Prepare the Backend for Production

Your backend uses `users.db` (SQLite) for Auth/Bookmarks. Free platforms like Render reset your files on every deploy. 

### Option A: Railway (Easiest for SQLite persistence)
1. Push your code to GitHub.
2. Go to [Railway.app](https://railway.app/).
3. Create a Project -> Add a GitHub repository -> Select your backend folder.
4. Add an **Environment Variable**:
   - `OPENROUTER_API_KEY`: <Your OpenRouter API Key>
   - `SECRET_KEY`: <A random secure string for JWT tokens>
5. Railway will automatically detect the `requirements.txt` and install python dependencies.
6. Make sure your start command is:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

### Option B: Render Web Service (Free)
1. Push your code to GitHub.
2. Go to [Render.com](https://render.com/).
3. Create a new `Web Service` connected to your repo.
4. **Build Command:** `pip install -r backend/requirements.txt`
5. **Start Command:** `cd backend && uvicorn main:app --host 0.0.0.0 --port 10000`
6. Add an **Environment Variable**: `OPENROUTER_API_KEY` and `SECRET_KEY`.
7. **Important:** To not lose User Bookmarks/Accounts on Render, you must attach a "Render Disk" to the backend (or change SQLite to a remote PostgreSQL DB like Supabase).

---

## Step 3: IMPORTANT - Configure CORS & Finalize

Once the Frontend and Backend are hosted, they will both have their own URLs (e.g., `https://shlokai.vercel.app` and `https://shlokai-backend.up.railway.app`).

**1. Update Backend CORS:**
Open `backend/main.py` and change the CORS allow list to match your new URL:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "https://shlokai.vercel.app" # <-- Apni nai frontend URL daalein
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**2. Deploy Frontend on Vercel:**
1. Go to [Vercel.com](https://vercel.com).
2. Import your GitHub project and set the Root Directory to `frontend`.
3. In Environment Variables, add `VITE_API_BASE` and set it to your Live Backend URL.
4. Click Deploy! 

---

## 🎉 Congratulations!
Your app is now Live!
- You can share the Vercel link with anyone.
- They can register an account, and the data will be securely handled by your live backend.
- The `final_gita.json` search will work smoothly since FAISS runs in-memory natively on your fast python backend!
