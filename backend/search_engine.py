"""
Gita Guru AI — Search Engine Module
Loads FAISS index + dataset once, handles all semantic searches.
Pure retrieval only — no generative content.
"""

import json
import os
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer


class GitaSearchEngine:
    """
    Sacred text search engine using FAISS vector similarity.
    Strict retrieval-only — returns exact verses from the dataset.
    """

    def __init__(self, data_dir: str = None):
        if data_dir is None:
            # Default: look in ../final/ relative to this file
            data_dir = os.path.join(os.path.dirname(__file__), "..", "final")

        data_path = os.path.join(data_dir, "final_gita.json")
        index_path = os.path.join(data_dir, "gita_index.faiss")

        print("[Engine] Loading SentenceTransformer model...")
        self.model = SentenceTransformer("all-MiniLM-L6-v2")

        print(f"[Engine] Loading FAISS index from {index_path}...")
        self.index = faiss.read_index(index_path)

        print(f"[Engine] Loading dataset from {data_path}...")
        with open(data_path, "r", encoding="utf-8") as f:
            self.data = json.load(f)

        print(f"[Engine] Ready — {len(self.data)} verses indexed.")

    def search(self, query: str, top_k: int = 5, threshold: float = 1.5):
        """
        Perform semantic search.

        Args:
            query:     User's search text
            top_k:     Number of results to return
            threshold: Maximum L2 distance. Results above this are filtered out.

        Returns:
            List of verse dicts with chapter, verse, sanskrit, translation, score.
            Returns empty list if nothing is relevant (strict mode).
        """
        query_embedding = self.model.encode([query])
        distances, indices = self.index.search(query_embedding, top_k)

        results = []
        for i, idx in enumerate(indices[0]):
            distance = float(distances[0][i])

            # Strict mode: skip results that are too far away
            if distance > threshold:
                continue

            verse = self.data[idx]
            results.append({
                "chapter": verse["chapter"],
                "verse": verse["verse"],
                "sanskrit": verse["sanskrit"],
                "translation": verse["translation"],
                "hindi_translation": verse.get("hindi_translation", ""),
                "score": round(1 - (distance / threshold), 3)  # Normalize to 0-1 relevance
            })

        return results
