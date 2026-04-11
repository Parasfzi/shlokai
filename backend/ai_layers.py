"""
ShlokAI — AI Enhancement Layers
Three controlled AI layers that operate STRICTLY on retrieved data.
No hallucination. No external knowledge. Gita-only.

Layer 1: Query Enhancement  — expands vague user queries
Layer 2: Smart Ranking      — picks the single best verse from FAISS results
Layer 3: Explain Mode       — explains the chosen verse in Hinglish
"""

import os
import json
import httpx
from typing import List, Dict, Any, Optional


# ─── OpenRouter client ────────────────────────────────────────────────────────
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
# Using a very stable and smart free model on OpenRouter:
MODEL = "google/gemini-2.0-flash-lite-preview-02-05:free" 


async def _call_llm(system_prompt: str, user_message: str) -> str:
    """
    Generic async LLM call via OpenRouter.
    Returns the model's reply as a plain string.
    Raises RuntimeError if API key is missing or request fails.
    """
    if not OPENROUTER_API_KEY:
        raise RuntimeError(
            "OPENROUTER_API_KEY environment variable not set. "
            "Add it to your .env file or set it in your shell."
        )

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",  # Required by OpenRouter
        "X-Title": "ShlokAI",
    }

    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_message},
        ],
        "temperature": 0.3,   # Low temp = more deterministic, less creative
        "max_tokens": 300,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(OPENROUTER_URL, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"].strip()


# ─── Layer 1: Query Enhancement ──────────────────────────────────────────────
QUERY_ENHANCE_SYSTEM = """\
You are a semantic query expander for a Bhagavad Gita search engine.

Your ONLY job is to take a vague user query and expand it into clear,
meaningful keywords and concepts that will help find a relevant Gita verse.

STRICT RULES:
- Output ONLY a comma-separated list of keywords/concepts.
- Do NOT write sentences. Do NOT answer the query.
- Do NOT add explanations, greetings, or commentary.
- Keep keywords related to life, spirituality, duty, dharma, karma, etc.
- Max 10 keywords.

Example:
User: "I feel lost in life"
Output: confusion, purpose, life direction, dharma, self-realization, duty, inner peace
"""


async def enhance_query(original_query: str) -> str:
    """
    Expands a vague user query into semantic keywords for better FAISS search.
    Returns the enhanced query string.
    Falls back to original query if AI layer fails.
    """
    try:
        enhanced = await _call_llm(QUERY_ENHANCE_SYSTEM, original_query)
        # Sanitize: strip quotes, extra whitespace, newlines
        enhanced = enhanced.replace('"', '').replace("'", "").strip()
        # Combine original + enhanced for richer embedding
        combined = f"{original_query} {enhanced}"
        print(f"[AI Layer 1] Original: '{original_query}' → Enhanced: '{combined}'")
        return combined
    except Exception as e:
        print(f"[AI Layer 1] Query enhancement failed: {e}. Falling back to original.")
        return original_query


# ─── Layer 2: Smart Ranking ───────────────────────────────────────────────────
RANKING_SYSTEM = """\
You are a relevance ranker for a Bhagavad Gita search engine.

You will receive:
1. A user's original query.
2. A numbered list of candidate Bhagavad Gita verses (Sanskrit + English translation).

Your ONLY task is to pick the single best verse that most directly
addresses the user's query.

STRICT RULES:
- You MUST choose from the given list only. No exceptions.
- Do NOT generate a new verse.
- Do NOT add any explanation or commentary.
- Output ONLY a single integer: the number of the best verse (1, 2, 3...).
"""


async def smart_rank(original_query: str, verses: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Uses AI to pick the single best verse from a list of FAISS results.
    Always returns one of the input verses — never generates new content.
    Falls back to verse[0] (highest FAISS score) if AI fails.
    """
    if len(verses) == 1:
        return verses[0]

    # Build a numbered list for the LLM
    verse_list_str = ""
    for i, v in enumerate(verses, start=1):
        verse_list_str += (
            f"\n[{i}] Chapter {v['chapter']}, Verse {v['verse']}\n"
            f"Sanskrit: {v['sanskrit'][:120]}...\n"
            f"Translation: {v['translation'][:200]}...\n"
        )

    user_message = f"User Query: \"{original_query}\"\n\nCandidates:{verse_list_str}"

    try:
        reply = await _call_llm(RANKING_SYSTEM, user_message)
        # Extract the first integer from the reply
        import re
        numbers = re.findall(r'\d+', reply)
        if numbers:
            chosen_idx = int(numbers[0]) - 1  # Convert to 0-based index
            if 0 <= chosen_idx < len(verses):
                print(f"[AI Layer 2] Smart rank chose verse #{chosen_idx + 1}: "
                      f"Ch.{verses[chosen_idx]['chapter']}:{verses[chosen_idx]['verse']}")
                return verses[chosen_idx]
    except Exception as e:
        print(f"[AI Layer 2] Smart ranking failed: {e}. Falling back to top FAISS result.")

    return verses[0]  # Safe fallback: best FAISS score


# ─── Layer 3: Explain Mode ────────────────────────────────────────────────────
EXPLAIN_SYSTEM = """\
You are a sacred text explainer for a Bhagavad Gita search engine.

You will receive a single Bhagavad Gita verse (Sanskrit + English translation).

Your task is to write a short, simple explanation of this verse in Hinglish
(Hindi + English mix, like how urban Indians naturally speak).

STRICT RULES:
- Explanation MUST be based ONLY on the given verse text.
- Do NOT add stories, external references, or unrelated knowledge.
- Do NOT mention other scriptures, people, or events not in the verse.
- Keep it 3–4 sentences maximum. Simple language.
- Tone: warm, thoughtful, like a wise friend explaining it to you.
"""


async def explain_verse(verse: Dict[str, Any]) -> str:
    """
    Generates a Hinglish explanation of a verse, strictly grounded in its text.
    Returns an empty string if the AI call fails.
    """
    user_message = (
        f"Chapter {verse['chapter']}, Verse {verse['verse']}\n"
        f"Sanskrit: {verse['sanskrit']}\n"
        f"Translation: {verse['translation']}"
    )

    try:
        explanation = await _call_llm(EXPLAIN_SYSTEM, user_message)
        print(f"[AI Layer 3] Explanation generated for Ch.{verse['chapter']}:{verse['verse']}")
        return explanation
    except Exception as e:
        print(f"[AI Layer 3] Explain mode failed: {e}.")
        return ""
