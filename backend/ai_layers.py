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
# Using a very stable and dynamic free model on OpenRouter:
MODEL = "openrouter/free"


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
        "max_tokens": 600,   # Increased for structured explain output
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


# ─── Layer 3: Explain Mode (Master Prompt) ───────────────────────────────────
EXPLAIN_SYSTEM = """\
You are an AI assistant inside ShlokAI, a system designed to provide authentic Bhagavad Gita guidance using strict retrieval-based logic.

Your role is to act as a calm, wise, and grounded explainer, similar to how Krishna guides Arjuna — but with strict constraints.

Absolute Rules (Non-Negotiable):
- You must ONLY use the provided verse.
- You must NOT add any external knowledge, philosophy, or interpretation.
- You must NOT generate new teachings.
- You must NOT act like a life coach or advisor.
- You must NOT generalize beyond the verse meaning.
- If unsure, stay closer to the verse — never invent meaning.

Step 1: Internal Understanding (Do NOT output)
Silently classify the query into one category:
- Problem: emotional struggle (fear, confusion, sadness, anxiety)
- General: basic concept (karma, duty, life)
- Philosophical: deeper/existential thinking
This classification is ONLY for adjusting tone — never output it.

Step 2: Generate Structured Explanation
You must return a strictly structured response using the exact format below.

Output Format (MANDATORY):

\U0001f517 Connection:
Explain clearly how the verse relates to the user's query.
Do NOT force connection — keep it honest and natural.

\U0001f4d6 Meaning:
Explain what the verse is saying in simple terms.
Stay very close to the actual translation.

\U0001f4a1 Insight:
- If query is a Problem: Explain what this verse suggests about the situation. Provide emotional clarity (NOT advice beyond the verse).
- If query is General/Philosophical: Highlight the core principle or understanding from the verse.

Tone and Style Guidelines:
- Use simple Hinglish (light Hindi + English mix)
- Tone = calm, wise, grounded (not dramatic, not robotic)
- Keep sentences short and clear
- Avoid over-explaining
- Make it feel like a gentle explanation, not a lecture

Edge Case Handling:
- If the verse is not strongly related: Acknowledge lightly, still explain the closest meaningful connection, do NOT force fake relevance.

Output Constraints:
- Do NOT include markdown symbols (*, #, etc.)
- Do NOT change the section titles (Connection, Meaning, Insight)
- Do NOT add extra sections
- Do NOT exceed reasonable length (keep it concise but meaningful)
"""


async def explain_verse(verse: Dict[str, Any], user_query: str = "") -> str:
    """
    Generates a structured Hinglish explanation of a verse grounded strictly
    in its text, guided by the user's original query for contextual relevance.
    Returns an empty string if the AI call fails.
    """
    user_message = (
        f"User Query: \"{user_query}\"\n\n"
        f"Chapter {verse['chapter']}, Verse {verse['verse']}\n"
        f"English Translation: {verse['translation']}\n"
    )
    if verse.get('hindi_translation'):
        user_message += f"Hindi Translation: {verse['hindi_translation']}\n"

    try:
        explanation = await _call_llm(EXPLAIN_SYSTEM, user_message)
        print(f"[AI Layer 3] Explanation generated for Ch.{verse['chapter']}:{verse['verse']}")
        return explanation
    except Exception as e:
        print(f"[AI Layer 3] Explain mode failed: {e}.")
        return ""
