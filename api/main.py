"""
HormuzWatch API — FastAPI backend
Serves live market data fetched from yfinance + AI-powered news feed via Anthropic.

Run:
    uvicorn api.main:app --reload --port 8000
from the hormuzwatch/ directory.
"""

import json
import os
import re
import threading
import time
import traceback
from datetime import date, datetime, timezone
from typing import Any

import numpy as np
import pandas as pd
import yfinance as yf
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

# ── Constants ──────────────────────────────────────────────────────────────────
CONFLICT_START  = date(2026, 2, 28)
HORMUZ_CLOSURE  = date(2026, 3, 7)
BRENT_BASE_DATE = "2026-03-02"
BRENT_BASE      = 77.74
WTI_BASE        = 71.23

PRICE_TICKERS   = ["BZ=F", "CL=F"]
VOL_TICKERS     = ["^OVX", "^VIX"]
EQUITY_TICKERS  = ["LMT", "RTX", "NOC", "XOM", "CVX", "BP", "FRO", "STNG",
                   "INSW", "NAT", "TK"]

CACHE_TTL       = 900   # 15 minutes
NEWS_CACHE_TTL  = 900   # 15 minutes

# ── App setup ──────────────────────────────────────────────────────────────────
app = FastAPI(title="HormuzWatch API", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

# ── In-memory TTL cache with per-key locks (prevents stampede) ────────────────
_cache: dict[str, tuple[Any, float]] = {}
_locks: dict[str, threading.Lock]    = {}
_locks_mu = threading.Lock()

def _get_lock(key: str) -> threading.Lock:
    with _locks_mu:
        if key not in _locks:
            _locks[key] = threading.Lock()
        return _locks[key]

def cached(key: str, fn, ttl: int = CACHE_TTL):
    # Fast path: already cached
    if key in _cache:
        val, ts = _cache[key]
        if time.monotonic() - ts < ttl:
            return val
    # Slow path: acquire per-key lock so only one thread calls fn()
    with _get_lock(key):
        # Re-check after acquiring lock (another thread may have populated it)
        if key in _cache:
            val, ts = _cache[key]
            if time.monotonic() - ts < ttl:
                return val
        val = fn()
        _cache[key] = (val, time.monotonic())
        return val


# ── Market data helpers ────────────────────────────────────────────────────────
def _safe_float(val, default=0.0) -> float:
    try:
        f = float(val)
        return f if np.isfinite(f) else default
    except Exception:
        return default


def _latest_close(tickers: list[str], auto_adjust: bool = True) -> dict[str, float]:
    try:
        raw = yf.download(
            tickers, period="5d",
            auto_adjust=auto_adjust,
            progress=False, threads=False,
        )
        if raw.empty:
            return {}
        close = raw["Close"].dropna(how="all")
        if isinstance(close, pd.Series):
            close = close.to_frame(name=tickers[0])
        last = close.iloc[-1]
        return {t: _safe_float(last.get(t, 0)) for t in tickers}
    except Exception:
        traceback.print_exc()
        return {}


def _build_status() -> dict:
    today        = date.today()
    conflict_day = max(1, (today - CONFLICT_START).days + 1)
    hormuz_day   = max(0, (today - HORMUZ_CLOSURE).days + 1)

    prices   = _latest_close(PRICE_TICKERS)
    vol      = _latest_close(VOL_TICKERS, auto_adjust=False)
    equities = _latest_close(EQUITY_TICKERS)

    brent = prices.get("BZ=F", 0) or BRENT_BASE
    wti   = prices.get("CL=F", 0) or WTI_BASE

    return {
        "as_of":         today.isoformat(),
        "fetched_at":    datetime.now(timezone.utc).isoformat(),
        "cache_ttl_s":   CACHE_TTL,
        "conflict_day":  conflict_day,
        "hormuz_day":    hormuz_day,
        "hormuz_status": "CLOSED" if today >= HORMUZ_CLOSURE else "OPEN",
        "oil": {
            "brent_price":   round(brent, 2),
            "wti_price":     round(wti, 2),
            "brent_indexed": round(brent / BRENT_BASE * 100, 1),
            "wti_indexed":   round(wti   / WTI_BASE   * 100, 1),
            "brent_base":    BRENT_BASE,
            "wti_base":      WTI_BASE,
            "brent_pct_chg": round((brent / BRENT_BASE - 1) * 100, 1),
            "wti_pct_chg":   round((wti   / WTI_BASE   - 1) * 100, 1),
        },
        "volatility": {
            "ovx": round(vol.get("^OVX", 0), 1),
            "vix": round(vol.get("^VIX", 0), 1),
        },
        "equities": {t: round(equities.get(t, 0), 2) for t in EQUITY_TICKERS},
    }


# ── News helpers ───────────────────────────────────────────────────────────────
def _clean_json_response(raw: str) -> str:
    """Strip markdown fences and extract the JSON array."""
    raw = raw.strip()
    raw = re.sub(r'^```json\s*', '', raw, flags=re.MULTILINE)
    raw = re.sub(r'^```\s*',     '', raw, flags=re.MULTILINE)
    raw = re.sub(r'```$',        '', raw, flags=re.MULTILINE)
    raw = raw.strip()

    start = raw.find('[')
    end   = raw.rfind(']')
    if start == -1 or end == -1:
        print(f"[news] No JSON array found. Raw response (first 500 chars):\n{raw[:500]}")
        raise ValueError(f"No JSON array found in Claude response: {raw[:200]}")
    return raw[start:end + 1]


def _anthropic_client():
    import anthropic as _anthropic
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY not set in environment / .env")
    return _anthropic.Anthropic(api_key=api_key)


def _build_news() -> list[dict]:
    client = _anthropic_client()

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
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

    raw = ""
    for block in response.content:
        if block.type == "text":
            raw += block.text

    cleaned = _clean_json_response(raw)
    items   = json.loads(cleaned)

    # Validate and normalise each item
    valid_categories = {"MILITARY", "ENERGY", "DIPLOMATIC", "HUMANITARIAN", "MARKETS"}
    valid_severities = {"CRITICAL", "HIGH", "MEDIUM", "LOW"}
    now_iso = datetime.now(timezone.utc).isoformat()

    result = []
    for item in items:
        result.append({
            "title":     str(item.get("title",    "No title")),
            "summary":   str(item.get("summary",  "")),
            "category":  item.get("category", "MARKETS") if item.get("category") in valid_categories else "MARKETS",
            "severity":  item.get("severity",  "MEDIUM")  if item.get("severity")  in valid_severities  else "MEDIUM",
            "source":    str(item.get("source",    "Unknown")),
            "timestamp": str(item.get("timestamp", now_iso)),
            "url":       item.get("url") or None,
        })

    return result


def _build_news_summary() -> dict:
    client = _anthropic_client()

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=400,
        tools=[{"type": "web_search_20250305", "name": "web_search"}],
        system=(
            "You are a geopolitical intelligence analyst. "
            "Respond with plain text only. No JSON. No markdown. No bullet points."
        ),
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

    text = ""
    for block in response.content:
        if block.type == "text":
            text += block.text

    return {
        "brief":      text.strip(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


# ── Routes ─────────────────────────────────────────────────────────────────────
@app.get("/api/status")
def status():
    try:
        return cached("status", _build_status)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/news")
def news():
    """AI-powered news feed. Cached for NEWS_CACHE_TTL seconds."""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="ANTHROPIC_API_KEY not configured. Add it to the .env file.",
        )
    try:
        return cached("news", _build_news, ttl=NEWS_CACHE_TTL)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/news/summary")
def news_summary():
    """Executive intelligence brief. Cached for NEWS_CACHE_TTL seconds."""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="ANTHROPIC_API_KEY not configured. Add it to the .env file.",
        )
    try:
        return cached("news_summary", _build_news_summary, ttl=NEWS_CACHE_TTL)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/health")
def health():
    return {"ok": True, "time": datetime.now(timezone.utc).isoformat()}


@app.get("/api/cache/clear")
def clear_cache():
    _cache.clear()
    return {"cleared": True}


# ── Serve React frontend (production) ─────────────────────────────────────────
from pathlib import Path
from fastapi.responses import FileResponse

_UI_DIST = Path(__file__).parent.parent / "hormuzwatch-ui" / "dist"

if _UI_DIST.exists():
    from fastapi.staticfiles import StaticFiles

    @app.get("/")
    def serve_root():
        return FileResponse(_UI_DIST / "index.html")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        candidate = _UI_DIST / full_path
        if candidate.exists() and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(_UI_DIST / "index.html")
