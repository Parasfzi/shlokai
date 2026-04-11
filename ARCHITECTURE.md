# ShlokAI (Gita Guru AI) - System Architecture & Logic

This document provides a complete technical explanation of how **ShlokAI** works under the hood.

## 1. Core Philosophy: Pure Retrieval, Zero Hallucination
The fundamental principle of this project is to serve **100% authentic** Bhagavad Gita verses. Unlike standard generative AI chatbots (like ChatGPT) which can invent or hallucinate information, ShlokAI operates as a **Semantic Search Engine**.

It does **not** generate new text. It only *retrieves* exact, verified data from a strictly curated JSON dataset.

## 2. System Architecture

The project is divided into three main pillars:
1. **Data Pipeline & Vector Database (FAISS)**
2. **Backend API (FastAPI)**
3. **Frontend UI (React + Vite)**

---

### A. Data Pipeline & Vectorization (How the AI understands text)
To allow a user to search for a concept (like *"fear of failure"*) and find a matching Sanskrit shlok, we use **Embeddings**.

1. **Curated Dataset (`final_gita.json`)**: 
   A JSON file containing all 700 verses, organized by `chapter`, `verse`, `sanskrit`, and `translation`.
2. **Generating Embeddings**: 
   Using the `sentence-transformers` library (specifically the `all-MiniLM-L6-v2` model), we convert both the Sanskrit verse and its English translation into a high-dimensional mathematical vector (an array of numbers).
3. **FAISS Index (`gita_index.faiss`)**: 
   These vectors are stored in a FAISS (Facebook AI Similarity Search) index. FAISS is highly optimized for searching millions of vectors in milliseconds.

### B. The Search Logic (How a search query works)
When a user types a query like *"How to control my anger?"*:

1. **Input Vectorization**: The backend takes the user's text and passes it to the exact same `sentence-transformer` model used during data preparation. This converts the user's string into a vector.
2. **Similarity Search (L2 Distance)**: The FAISS index compares the user's vector against all 700 verse vectors. It calculates the "L2 Distance" (Euclidean distance) between them.
3. **Fetching the Match**: The vectors with the lowest distance are mathematically the most semantically similar to the user's query. FAISS returns the `Index ID` of these top matches.
4. **Data Retrieval**: The backend uses these `Index IDs` to fetch the exact Sanskrit verse and English translation from the `final_gita.json` array.

### C. Backend (FastAPI)
The backend acts as the bridge:
- It runs a high-performance Python server using **FastAPI**.
- On startup, it loads the model and FAISS index into memory so that searches happen instantly.
- It exposes a `POST /search` endpoint.
- **Strict Mode**: If the closest match returned by FAISS has an unexpectedly high distance (meaning no verse actually matches the query well enough), the system can be configured to return *"No relevant shlok found"* rather than returning a random forced verse.

### D. Frontend (React / Vite)
- Built with React for a snappy, modern single-page experience.
- Sends the user's query via an HTTP request to the FastAPI backend.
- Renders the returned JSON (Chapter, Verse, Sanskrit, Translation) into beautiful, culturally themed UI cards.

## 3. Summary of Technologies Used
- **Sentence-Transformers (MiniLM)**: For semantic embeddings.
- **FAISS**: For rapid vector-based similarity search.
- **FastAPI**: For the backend REST API.
- **React (Vite)**: For the frontend user interface.
- **Pure CSS**: For lightweight, custom styling without heavy frameworks.

By relying on **Retrieval-Augmented Logic** without a generative step, ShlokAI guarantees the absolute sanctity, precision, and authenticity of the scriptures it serves.
