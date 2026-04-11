import json
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

# Load everything globally so the search function is fast
print("Loading search engine...")
model = SentenceTransformer('all-MiniLM-L6-v2')
index = faiss.read_index("gita_index.faiss")

with open("final_gita.json", "r", encoding="utf-8") as f:
    data = json.load(f)
print("Search engine ready!\n" + "-"*40)

def search(query, k=3):
    # Convert query to embedding
    query_vec = model.encode([query])

    # Search (L2 distance, lower is better)
    distances, indices = index.search(query_vec, k)

    results = []
    for i in indices[0]:
        results.append(data[i])

    return results

if __name__ == "__main__":
    test_query = "fear of failure"
    print(f"Testing search with query: '{test_query}'\n")
    
    results = search(test_query)
    
    for r in results:
        print(f"Chapter: {r['chapter']}")
        print(f"Verse: {r['verse']}")
        try:
            print(f"Sanskrit:\n{r['sanskrit']}")
        except UnicodeEncodeError:
            print(f"Sanskrit:\n{r['sanskrit'].encode('utf-8', 'replace').decode('cp1252', 'replace')}")
            
        try:
            print(f"Translation: {r['translation']}")
        except UnicodeEncodeError:
            print(f"Translation: {r['translation'].encode('utf-8', 'replace').decode('cp1252', 'replace')}")
            
        print("-" * 40)
