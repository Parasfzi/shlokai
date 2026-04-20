import asyncio
import os
import httpx
from dotenv import load_dotenv

load_dotenv("backend/.env")

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "openrouter/free"

EXPLAIN_SYSTEM = "You are a test"
user_message = "Test message"

async def test_llm():
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",  
        "X-Title": "ShlokAI",
    }
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": EXPLAIN_SYSTEM},
            {"role": "user",   "content": user_message},
        ],
        "temperature": 0.3,
        "max_tokens": 600,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(OPENROUTER_URL, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            print("SUCCESS:", data["choices"][0]["message"]["content"])
    except httpx.HTTPError as e:
        print("HTTP ERROR:", e)
        if hasattr(e, 'response') and e.response:
            print("Response:", e.response.text)
    except Exception as e:
        print("OTHER ERROR:", e)

if __name__ == "__main__":
    asyncio.run(test_llm())
