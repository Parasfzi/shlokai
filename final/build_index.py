import json
import numpy as np
from sentence_transformers import SentenceTransformer
import faiss

# --- STEP 1: Generate Embeddings ---
print("Loading model: all-MiniLM-L6-v2...")
model = SentenceTransformer('all-MiniLM-L6-v2')

print("Loading final_gita.json...")
with open("final_gita.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Combine text for better search. Adding chapter and verse might also help context.
texts = []
for item in data:
    # Just combining Sanskrit and English translation as requested.
    combined = item["sanskrit"] + " " + item["translation"]
    texts.append(combined)

print("Creating embeddings (this might take a minute)...")
embeddings = model.encode(texts)

np.save("embeddings.npy", embeddings)
print("Embeddings created and saved to embeddings.npy")

# --- STEP 2: Build FAISS Index ---
print("Building FAISS index...")
dimension = embeddings.shape[1]
index = faiss.IndexFlatL2(dimension)

index.add(embeddings)

faiss.write_index(index, "gita_index.faiss")
print("FAISS index ready and saved to gita_index.faiss")
