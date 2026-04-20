import asyncio
import httpx

async def fetch_models():
    async with httpx.AsyncClient() as client:
        r = await client.get("https://openrouter.ai/api/v1/models")
        data = r.json()
        free_gemini = [m["id"] for m in data["data"] if "free" in m["id"].lower() and "gemini" in m["id"].lower()]
        all_free = [m["id"] for m in data["data"] if "free" in m["id"].lower()]
        print("Free Gemini:", free_gemini)
        print("Top 5 free:", all_free[:5])

if __name__ == "__main__":
    asyncio.run(fetch_models())
