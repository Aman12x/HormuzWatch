"""
macro.py — HormuzWatch
Pulls macroeconomic series from FRED:
  - CPIAUCSL  : Consumer Price Index (All Urban, Seasonally Adjusted)
  - DTWEXBGS  : Trade-Weighted US Dollar Index (Broad, Goods & Services)
  - DCOILBRENTEU : Brent crude (daily, EIA via FRED)
Saves to data/processed/macro.csv.
"""

import os
import sys
from pathlib import Path
from datetime import date

import pandas as pd
from dotenv import load_dotenv
from fredapi import Fred

# ── paths ──────────────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parents[1]
PROCESSED = ROOT / "data" / "processed"
PROCESSED.mkdir(parents=True, exist_ok=True)

load_dotenv(ROOT / ".env")

START = "2025-11-01"
END = date.today().isoformat()

FRED_SERIES = {
    "CPIAUCSL":     "cpi_all_urban_sa",
    "DTWEXBGS":     "usd_trade_weighted",
    "DCOILBRENTEU": "brent_crude_eia",
}


def fetch_fred(api_key: str) -> pd.DataFrame:
    fred = Fred(api_key=api_key)
    frames = []
    for series_id, label in FRED_SERIES.items():
        print(f"  Fetching {series_id} ({label}) …")
        try:
            s = fred.get_series(series_id, observation_start=START, observation_end=END)
        except Exception as exc:
            print(f"  [WARN] Failed to fetch {series_id}: {exc}", file=sys.stderr)
            continue
        df = pd.DataFrame({
            "date": pd.to_datetime(s.index).normalize(),
            "value": s.values,
            "series_id": series_id,
            "label": label,
        })
        frames.append(df)
    return pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()


def clean(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values(["series_id", "date"]).reset_index(drop=True)
    return df


def print_summary(df: pd.DataFrame) -> None:
    print(f"\n{'─'*50}")
    print("  macro.csv summary")
    print(f"{'─'*50}")
    print(f"  Rows       : {len(df):,}")
    print(f"  Date range : {df['date'].min().date()} → {df['date'].max().date()}")
    for sid, grp in df.groupby("series_id"):
        label = grp["label"].iloc[0]
        nulls = grp["value"].isna().sum()
        print(
            f"  {sid:16s} ({label:24s})  "
            f"obs={len(grp):4d}  nulls={nulls}  "
            f"min={grp['value'].min():.2f}  max={grp['value'].max():.2f}"
        )


def main() -> None:
    api_key = os.getenv("FRED_API_KEY")
    if not api_key:
        sys.exit("ERROR: FRED_API_KEY not set. Copy .env.example → .env and add your key.")

    print("Fetching FRED macro series …")
    df = fetch_fred(api_key)

    if df.empty:
        sys.exit("ERROR: No FRED data retrieved. Check your API key and network.")

    df = clean(df)

    out_path = PROCESSED / "macro.csv"
    df.to_csv(out_path, index=False)
    print(f"\nSaved → {out_path}")

    print_summary(df)


if __name__ == "__main__":
    main()
