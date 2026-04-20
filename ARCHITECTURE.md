# 🕉️ ShlokAI — The Complete A to Z Guide

Welcome to the complete architectural and operational guide for **ShlokAI**. This document explains exactly what the project is, how it works under the hood, how the AI layers operate, and how requests flow from the user's browser to the sacred texts.

---

## 1. What is ShlokAI?
ShlokAI is an intelligent, completely authentic "Semantic Search Engine" for the **Bhagavad Gita**. 

Unlike standard AI chatbots (like ChatGPT) which can "hallucinate" or invent fake verses, ShlokAI operates on a strict **Retrieval-Augmented Logic**. It guarantees absolute authenticity because it **never generates verses**. It only retrieves pure, verified Sanskrit data from a curated dataset based on the user's emotional or philosophical query.

For example, if a user searches *"I am feeling lost and sad"*, ShlokAI doesn't just look for the words "lost" and "sad". It mathematically understands the concepts of grief and confusion, and brings back the exact verse where Lord Krishna guides Arjuna through a similar mental state.

---

## 2. System Architecture
The project is built on a modern **Containerized Full-Stack Architecture**, separated into three massive pillars:

### A. The Vectors & Database Layer (`/final`)
- **JSON Dataset (`final_gita.json`)**: Contains 700 verses of the Gita with Chapter, Verse Number, Sanskrit Text, English Translation (Swami Gambhirananda), and Hindi Translation (Swami Tejomayananda).
- **FAISS Vector Database**: A highly optimized searching technology built by Facebook AI.
- **SQLite Relational Database**: Handles User Accounts, Passwords (hashed), and Bookmarks.

### B. The Backend Layer (`/backend`)
- **FastAPI (Python)**: An ultra-fast, modern backend framework.
- **Sentence-Transformers**: A local Machine Learning model (`all-MiniLM-L6-v2`) loaded into memory to convert English queries into mathematical vectors instantly.
- **OpenRouter (LLM Integration)**: Optionally used for advanced features like "Query Enhancement" and "Explain Mode".
- **PyJWT & PBKDF2**: Handles secure JWT Bearer Tokens and secure password hashing algorithms.
- **Resend API**: Handles automated email sending for Password resets.

### C. The Frontend Layer (`/frontend`)
- **React (Vite)**: The user interface, built for speed and a lightweight DOM.
- **Pure CSS**: Designed with a custom "Glassmorphism" dark/gold premium aesthetic without relying on heavy UI frameworks like Tailwind.
- **Interactive Modals**: Seamlessly handles searches, logins, and reading experiences dynamically without page reloads.

---

## 3. How a Shlok is Found (The Search Flow)
Let's trace exactly what happens when a user types a query like *"karma and duty"*.

### Step 1: Query Enhancement (AI Layer 1 - Optional)
- User types *"karma and duty"*.
- If `enhance_query` is enabled, the backend secretly sends this query to a large language model (LLM) via OpenRouter.
- The LLM acts as an enhancer. It rewrites *"karma and duty"* into a much richer string: *"action without attachment, fulfilling responsibilities, duty driven by righteousness, Nishkama Karma."*
- *Why?* Because richer context helps the mathematical search engine find better matches.

### Step 2: Vectorization
- The backend takes the query (or the enhanced query) and passes it to our local `SentenceTransformer` model.
- The model translates the English text into a **high-dimensional mathematical vector** (an array of 384 floating-point numbers). This vector represents the "meaning" of the sentence.

### Step 3: Semantic Search (FAISS)
- Inside the RAM of the server sits the **FAISS Index**. This index contains the pre-calculated 384-dimensional vectors for all 700 verses of the Gita.
- The backend compares the user's vector against all 700 verse vectors.
- It calculates the **L2 Distance** (Euclidean distance). Vectors with the smallest distance have the closest semantic meaning.
- FAISS instantly returns the `Index IDs` of the top 5 closest matches.

### Step 4: Smart Ranking (AI Layer 2 - Optional)
- The backend now has 5 highly relevant verses retrieved from the JSON dataset.
- If `smart_rank` is enabled, the backend sends the user's original query and these 5 translations to the LLM.
- The LLM acts as a divine scholar. It reads the 5 verses and strictly decides which **single** verse is the absolute best answer to the user's problem.

### Step 5: Explain Mode (AI Layer 3 - Optional)
- If the user requested an explanation, the backend sends the final chosen verse to the LLM.
- The LLM returns a short, comforting Hinglish explanation directly tied to the retrieved Sanskrit. *Crucially, the LLM is only allowed to explain the retrieved text, not invent new text.*

### Step 6: Delivery
- The backend packages the Chapter, Verse, Sanskrit, English, Hindi, and Explanation into a clean JSON response and sends it back to the React UI, which renders it beautifully.

---

## 4. The Authentication System
ShlokAI uses a completely stateless JWT authentication system.

1. **Registration**: User provides an email and password. Backend uses `PBKDF2` with a unique salt to hash the password securely, then stores it in SQLite.
2. **Login**: User provides credentials. Backend verifies the hash. If correct, it generates a securely signed **JWT (Json Web Token)** containing the `user_id`.
3. **Authorization**: When the user tries to save a Bookmark, the React app attaches `Authorization: Bearer <token>` to the HTTP headers. FastAPI securely decodes this token to extract the user's identity.

### Password Resets (The Forgot Password Flow)
1. User enters their email in the UI.
2. Backend generates a highly specific JWT token with `"type": "reset"` and a very short expiry (15 minutes).
3. The Backend uses the **Resend API** to email the user a beautiful HTML link containing this token.
4. User clicks the link, lands on the `ResetPassword` page in React, and enters a new password.
5. The backend safely verifies the token, hashes the new password, and updates the database.

---

## 5. Deployment Architecture

To ensure the absolute lowest latency and easiest maintenance:

- **The Database & Backend**: The entire Python API, FAISS indices, datasets, and SQLite database are packaged into a single **Docker Container**. This container is deployed on **Hugging Face Spaces** (acting as your powerful server). Because everything lives locally inside the container (even the databases), responses remain lightning-fast.
- **The Frontend**: The React application is built into static HTML/CSS/JS and deployed globally on the **Vercel Edge Network**. This ensures the website loads instantly for users anywhere in the world on a custom `.in` domain.

---

## Summary

In short, ShlokAI brings ancient wisdom to the modern age by blending **Mathematical Vector Spaces** with **Large Language Models**, wrapped in a sleek, **Highly Secure Web Application**. It reads human problems, understands them semantically, targets the exact coordinate of that emotion within the Bhagavad Gita's 700 vectors, and delivers peace.
