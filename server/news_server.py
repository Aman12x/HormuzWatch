"""Lightweight standalone server for the immutable final news archive."""

import os
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.news_snapshot import final_news_items, final_news_summary

app = FastAPI(title="HormuzWatch News Server", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
        if origin.strip()
    ],
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/api/news")
def news():
    return final_news_items()


@app.get("/api/news/summary")
def news_summary():
    return final_news_summary()


@app.get("/api/health")
def health():
    return {"ok": True, "time": datetime.now(timezone.utc).isoformat()}
