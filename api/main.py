"""
HormuzWatch API — FastAPI backend
Serves the final June 18 market snapshot and cutoff-bounded intelligence feed.

Run:
    uvicorn api.main:app --reload --port 8000
from the hormuzwatch/ directory.
"""

import os
import secrets
import subprocess
import sys
import threading
import time
import traceback
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import numpy as np
import pandas as pd
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from analysis_config import (
    ANALYSIS_END,
    CONFLICT_START,
    HORMUZ_CLOSURE,
    HORMUZ_REOPENED,
)
from api.news_snapshot import final_news_items, final_news_summary

load_dotenv()

# Lazy import of compute module — deferred so heavy deps (scipy, linearmodels)
# don't crash the process before uvicorn can even bind.
_compute = None

def _get_compute():
    global _compute
    if _compute is None:
        try:
            import importlib
            _compute = importlib.import_module("api.compute")
        except Exception as exc:
            print(f"[compute] import failed: {exc}")
    return _compute

_ROOT = Path(__file__).parent.parent   # hormuzwatch/

# ── Constants ──────────────────────────────────────────────────────────────────
BRENT_BASE_DATE = "2026-03-02"
BRENT_BASE      = 77.74
WTI_BASE        = 71.23

VOL_TICKERS     = ["^OVX", "^VIX"]
EQUITY_TICKERS  = ["LMT", "RTX", "NOC", "XOM", "CVX", "BP", "FRO", "STNG",
                   "INSW", "NAT", "TK"]

CACHE_TTL       = 900   # 15 minutes

# ── Pipeline refresh ───────────────────────────────────────────────────────────
_PIPELINES = ["energy", "equities", "commodities", "volatility", "macro", "donors"]
_refresh_lock = threading.Lock()

def _run_pipelines() -> None:
    """Run all data-ingestion pipelines as subprocesses, then clear cache."""
    if not _refresh_lock.acquire(blocking=False):
        print("[refresh] Refresh already running; skipping duplicate request.")
        return
    print("[refresh] Starting pipeline refresh …")
    try:
        for pipe in _PIPELINES:
            try:
                result = subprocess.run(
                    [sys.executable, "-m", f"pipelines.{pipe}"],
                    cwd=str(_ROOT),
                    capture_output=True,
                    text=True,
                    timeout=180,
                )
                if result.returncode != 0:
                    print(f"[refresh] {pipe} FAILED:\n{result.stderr[:500]}")
                else:
                    print(f"[refresh] {pipe} OK")
            except subprocess.TimeoutExpired:
                print(f"[refresh] {pipe} timed out")
            except Exception as exc:
                print(f"[refresh] {pipe} error: {exc}")
        for k in ("status", "timeseries", "metrics"):
            _cache.pop(k, None)
        print("[refresh] Done.")
    finally:
        _refresh_lock.release()


# ── Scheduler lifespan ─────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # The study window is closed at the reopening date; deployments must not
    # silently extend the dataset with newer observations.
    yield


# ── App setup ──────────────────────────────────────────────────────────────────
app = FastAPI(title="HormuzWatch API", version="1.2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
        if origin.strip()
    ],
    allow_methods=["GET", "POST"],
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


def _require_admin(x_admin_key: str | None = Header(default=None)) -> None:
    configured = os.getenv("ADMIN_API_KEY")
    if not configured:
        raise HTTPException(status_code=503, detail="Administrative API is disabled")
    if not x_admin_key or not secrets.compare_digest(x_admin_key, configured):
        raise HTTPException(status_code=401, detail="Invalid administrative credentials")


# ── Market data helpers ────────────────────────────────────────────────────────
def _safe_float(val, default=0.0) -> float:
    try:
        f = float(val)
        return f if np.isfinite(f) else default
    except Exception:
        return default


def _final_market_snapshot() -> tuple[dict[str, float], dict[str, float], dict[str, float]]:
    """Read cutoff-bounded final observations instead of re-querying the network."""
    prices: dict[str, float] = {}
    volatility: dict[str, float] = {}
    equities: dict[str, float] = {}
    try:
        energy = pd.read_csv(_ROOT / "data" / "processed" / "energy.csv")
        energy = energy[energy["date"] <= ANALYSIS_END]
        for series, ticker in (("brent", "BZ=F"), ("wti", "CL=F")):
            values = energy.loc[energy["series"] == series, "price"].dropna()
            if not values.empty:
                prices[ticker] = _safe_float(values.iloc[-1])

        vol = pd.read_csv(_ROOT / "data" / "processed" / "volatility.csv")
        vol = vol[vol["date"] <= ANALYSIS_END]
        for ticker in VOL_TICKERS:
            values = vol.loc[vol["ticker"] == ticker, "value"].dropna()
            if not values.empty:
                volatility[ticker] = _safe_float(values.iloc[-1])

        eq = pd.read_csv(_ROOT / "data" / "processed" / "equities.csv")
        eq = eq[eq["date"] <= ANALYSIS_END]
        for ticker in EQUITY_TICKERS:
            column = f"{ticker}_close"
            if column in eq:
                values = eq[column].dropna()
                if not values.empty:
                    equities[ticker] = _safe_float(values.iloc[-1])
    except (FileNotFoundError, KeyError, pd.errors.ParserError):
        traceback.print_exc()
    return prices, volatility, equities


def _build_status() -> dict:
    conflict_day = (HORMUZ_REOPENED - CONFLICT_START).days + 1
    hormuz_day   = (HORMUZ_REOPENED - HORMUZ_CLOSURE).days

    prices, vol, equities = _final_market_snapshot()

    brent = prices.get("BZ=F", 0) or BRENT_BASE
    wti   = prices.get("CL=F", 0) or WTI_BASE

    return {
        "as_of":         ANALYSIS_END,
        "fetched_at":    datetime.now(timezone.utc).isoformat(),
        "cache_ttl_s":   CACHE_TTL,
        "conflict_day":  conflict_day,
        "hormuz_day":    hormuz_day,
        "hormuz_status": "OPEN",
        "hormuz_reopened_on": ANALYSIS_END,
        "study_status": "FINAL",
        "market_data_status": "OBSERVED" if prices.get("BZ=F") and prices.get("CL=F") else "FALLBACK",
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
def _safe_external_url(value: Any) -> str | None:
    """Allow only absolute HTTP(S) links in source metadata."""
    if not isinstance(value, str):
        return None
    try:
        parsed = urlparse(value.strip())
    except ValueError:
        return None
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return None
    return value.strip()

# ── Routes ─────────────────────────────────────────────────────────────────────
@app.get("/api/status")
def status():
    try:
        return cached("status", _build_status)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/news")
def news():
    """Source-linked final archive, capped at the analysis end date."""
    return final_news_items()


@app.get("/api/news/summary")
def news_summary():
    """Final executive brief, capped at the analysis end date."""
    return final_news_summary()


@app.get("/api/health")
def health():
    return {"ok": True, "time": datetime.now(timezone.utc).isoformat()}


@app.post("/api/cache/clear")
def clear_cache(_: None = Depends(_require_admin)):
    _cache.clear()
    return {"cleared": True}


# ── Final econometric data ─────────────────────────────────────────────────────
_TIMESERIES_TTL = 3600
_METRICS_TTL    = 3600


@app.get("/api/data/timeseries")
def timeseries():
    """
    Time-series arrays for the frontend charts.
    Returns: oilPrices, oilEventDates, equitiesCAR, volatility, updatedAt
    Falls back gracefully if CSVs are missing.
    """
    c = _get_compute()
    if c is None:
        raise HTTPException(status_code=503, detail="compute module unavailable")
    try:
        return cached("timeseries", c.build_timeseries, ttl=_TIMESERIES_TTL)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/metrics")
def metrics():
    """
    Computed econometric metrics: futuresATT, sector CARs, DiD coefficients, etc.
    Returns: syntheticControl, attByPhase, equityStats, tickerCAR,
             shippingPlacebo, oilStats, didResults (if available), updatedAt
    """
    c = _get_compute()
    if c is None:
        raise HTTPException(status_code=503, detail="compute module unavailable")
    try:
        return cached("metrics", c.build_metrics, ttl=_METRICS_TTL)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/refresh")
def manual_refresh(_: None = Depends(_require_admin)):
    """Reproduce the fixed-window datasets in the background."""
    if _refresh_lock.locked():
        return {"status": "already_running"}
    threading.Thread(target=_run_pipelines, daemon=True).start()
    return {"status": "refresh_started", "time": datetime.now(timezone.utc).isoformat()}


# ── Serve React frontend (production) ─────────────────────────────────────────
from pathlib import Path
from fastapi.responses import FileResponse

_UI_DIST = Path(__file__).parent.parent / "hormuzwatch-ui" / "dist"
_UI_DIST_RESOLVED = _UI_DIST.resolve()


def _safe_ui_candidate(full_path: str) -> Path | None:
    candidate = (_UI_DIST_RESOLVED / full_path).resolve()
    if (
        candidate.is_relative_to(_UI_DIST_RESOLVED)
        and candidate.exists()
        and candidate.is_file()
    ):
        return candidate
    return None

if _UI_DIST.exists():
    @app.get("/")
    def serve_root():
        return FileResponse(_UI_DIST / "index.html")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        candidate = _safe_ui_candidate(full_path)
        if candidate is not None:
            return FileResponse(candidate)
        return FileResponse(_UI_DIST / "index.html")
