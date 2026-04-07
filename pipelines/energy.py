"""
energy.py — HormuzWatch
Pulls Brent crude and WTI daily prices from yfinance + FRED DCOILBRENTEU.
Saves clean CSVs to data/processed/.
"""

import os
import sys
from pathlib import Path
from datetime import date

import pandas as pd
import yfinance as yf
from dotenv import load_dotenv
from fredapi import Fred

# ── paths ──────────────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parents[1]
PROCESSED = ROOT / "data" / "processed"
PROCESSED.mkdir(parents=True, exist_ok=True)

load_dotenv(ROOT / ".env")

START = "2025-11-01"
END = date.today().isoformat()


def fetch_yfinance() -> pd.DataFrame:
    """Pull BZ=F (Brent) and CL=F (WTI) from Yahoo Finance."""
    tickers = {"BZ=F": "brent", "CL=F": "wti"}
    frames = []
    for symbol, label in tickers.items():
        raw = yf.download(symbol, start=START, end=END, auto_adjust=True, progress=False)
        if raw.empty:
            print(f"  [WARN] No data returned for {symbol}", file=sys.stderr)
            continue
        close = raw["Close"].copy()
        # yfinance may return a MultiIndex column when downloading a single ticker
        if isinstance(close, pd.DataFrame):
            close = close.iloc[:, 0]
        df = pd.DataFrame({
            "date": close.index.normalize(),
            "price": close.values,
            "series": label,
            "source": "yfinance",
        })
        frames.append(df)
    return pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()


def fetch_fred_brent(api_key: str) -> pd.DataFrame:
    """Pull DCOILBRENTEU from FRED as a secondary Brent source."""
    fred = Fred(api_key=api_key)
    series = fred.get_series("DCOILBRENTEU", observation_start=START, observation_end=END)
    df = pd.DataFrame({
        "date": pd.to_datetime(series.index).normalize(),
        "price": series.values,
        "series": "brent",
        "source": "fred_DCOILBRENTEU",
    })
    return df


def clean(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["date"] = pd.to_datetime(df["date"])
    df = df.dropna(subset=["price"])
    df = df.sort_values(["series", "source", "date"]).reset_index(drop=True)
    return df


def print_summary(df: pd.DataFrame, label: str) -> None:
    print(f"\n{'─'*50}")
    print(f"  {label}")
    print(f"{'─'*50}")
    print(f"  Rows       : {len(df):,}")
    print(f"  Date range : {df['date'].min().date()} → {df['date'].max().date()}")
    print(f"  Nulls      : {df['price'].isna().sum()}")
    for key, grp in df.groupby(["series", "source"]):
        print(
            f"  [{key[0]:6s} | {key[1]:22s}]  "
            f"min={grp['price'].min():.2f}  max={grp['price'].max():.2f}"
        )


def main() -> None:
    api_key = os.getenv("FRED_API_KEY")
    if not api_key:
        sys.exit("ERROR: FRED_API_KEY not set. Copy .env.example → .env and add your key.")

    print("Fetching Yahoo Finance oil prices …")
    yf_df = fetch_yfinance()

    print("Fetching FRED DCOILBRENTEU …")
    fred_df = fetch_fred_brent(api_key)

    combined = clean(pd.concat([yf_df, fred_df], ignore_index=True))

    out_path = PROCESSED / "energy.csv"
    combined.to_csv(out_path, index=False)
    print(f"\nSaved → {out_path}")

    print_summary(combined, "energy.csv summary")


if __name__ == "__main__":
    main()
