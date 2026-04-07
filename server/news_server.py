"""
HormuzWatch — Standalone News Server
Alternative to running the full api/main.py — serves ONLY the news endpoints.
Useful for Railway split-service deployments or local testing on a different port.

Run (from hormuzwatch/):
    uvicorn server.news_server:app --port 8001 --reload

NOTE: If you're running api/main.py on :8000 already, that server already
includes /api/news and /api/news/summary — you don't need this file.
"""

import json
import os
import re
import time
import traceback
from datetime import datetime, timezone

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI(title="HormuzWatch News Server", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

NEWS_CACHE_TTL = 900
_cache: dict = {}


def _cached(key: str, fn, ttl: int = NEWS_CACHE_TTL):
    if key in _cache:
        val, ts = _cache[key]
        if time.monotonic() - ts < ttl:
            return val
    val = fn()
    _cache[key] = (val, time.monotonic())
    return val


def _clean_json_response(raw: str) -> str:
    raw = raw.strip()
    raw = re.sub(r'^```json\s*', '', raw, flags=re.MULTILINE)
    raw = re.sub(r'^```\s*',     '', raw, flags=re.MULTILINE)
    raw = re.sub(r'```$',        '', raw, flags=re.MULTILINE)
    raw = raw.strip()

    start = raw.find('[')
    end   = raw.rfind(']')
    if start == -1 or end == -1:
        print(f"[news] No JSON array found. Raw (first 500 chars):\n{raw[:500]}")
        raise ValueError(f"No JSON array in Claude response: {raw[:200]}")
    return raw[start:end + 1]


def _client():
    import anthropic
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY not set")
    return anthropic.Anthropic(api_key=api_key)


def _build_news() -> list[dict]:
    client   = _client()
    response = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=2000,
        tools=[{"type": "web_search_20250305", "name": "web_search"}],
        system=(
            "You are a geopolitical intelligence analyst monitoring the 2026 "
            "US-Israel war on Iran and its global economic impact. "
            "Return structured JSON only. No preamble. No markdown. No backticks."
        ),
        messages=[{
            "role": "user",
            "content": (
                "Search for the latest news from the last 24 hours on:\n"
                "1. US-Israel military operations in Iran\n"
                "2. Strait of Hormuz shipping and oil prices\n"
                "3. Global economic impact: food prices, fertilizer, energy\n"
                "4. Diplomatic developments: ceasefire talks, UN, Turkey, Pakistan\n\n"
                "Return a JSON array of up to 12 items, each with:\n"
                "{\n"
                '  "title": string,\n'
                '  "summary": "string (2 sentences max)",\n'
                '  "category": "one of [MILITARY, ENERGY, DIPLOMATIC, HUMANITARIAN, MARKETS]",\n'
                '  "severity": "one of [CRITICAL, HIGH, MEDIUM, LOW]",\n'
                '  "source": string,\n'
                '  "timestamp": "ISO string (today if unknown)",\n'
                '  "url": "string or null"\n'
                "}\n"
                "Return ONLY the JSON array. Absolutely no markdown, no backticks, "
                "no preamble, no explanation."
            ),
        }],
    )

    raw = "".join(b.text for b in response.content if b.type == "text")
    cleaned = _clean_json_response(raw)
    items   = json.loads(cleaned)

    valid_cats = {"MILITARY", "ENERGY", "DIPLOMATIC", "HUMANITARIAN", "MARKETS"}
    valid_sevs = {"CRITICAL", "HIGH", "MEDIUM", "LOW"}
    now_iso    = datetime.now(timezone.utc).isoformat()

    return [
        {
            "title":     str(i.get("title",    "No title")),
            "summary":   str(i.get("summary",  "")),
            "category":  i.get("category", "MARKETS") if i.get("category") in valid_cats else "MARKETS",
            "severity":  i.get("severity",  "MEDIUM")  if i.get("severity")  in valid_sevs  else "MEDIUM",
            "source":    str(i.get("source",    "Unknown")),
            "timestamp": str(i.get("timestamp", now_iso)),
            "url":       i.get("url") or None,
        }
        for i in items
    ]


def _build_summary() -> dict:
    client   = _client()
    response = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=400,
        tools=[{"type": "web_search_20250305", "name": "web_search"}],
        system="You are a geopolitical intelligence analyst. Respond with plain text only.",
        messages=[{
            "role": "user",
            "content": (
                "Search for current news and give an executive intelligence brief "
                "on the current state of the 2026 Iran war and its global economic impact. "
                "In exactly 3 sentences. Be specific with numbers where possible. "
                "Return plain text only, no JSON, no formatting."
            ),
        }],
    )
    text = "".join(b.text for b in response.content if b.type == "text")
    return {"brief": text.strip(), "updated_at": datetime.now(timezone.utc).isoformat()}


@app.get("/api/news")
def news():
    if not os.getenv("ANTHROPIC_API_KEY"):
        raise HTTPException(status_code=503, detail="ANTHROPIC_API_KEY not configured")
    try:
        return _cached("news", _build_news)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/news/summary")
def news_summary():
    if not os.getenv("ANTHROPIC_API_KEY"):
        raise HTTPException(status_code=503, detail="ANTHROPIC_API_KEY not configured")
    try:
        return _cached("news_summary", _build_summary)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/health")
def health():
    return {"ok": True, "time": datetime.now(timezone.utc).isoformat()}
