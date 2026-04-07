"""
commodities.py — HormuzWatch
Pulls daily prices for six commodity series from yfinance.
Saves to data/processed/commodities.csv.

Series and categories
─────────────────────
  hormuz_exposed    : BZ=F  (Brent crude)
                      CL=F  (WTI crude)
  non_hormuz_energy : NG=F  (Henry Hub natural gas front-month)
                      COAL  (VanEck Coal ETF — coal sector proxy)
  agriculture       : ZW=F  (CBOT Wheat)
                      ZC=F  (CBOT Corn)

Note on coal: MTF=F (Rotterdam Coal futures) is delisted on yfinance
after December 2025 and has zero post-event coverage. COAL (VanEck
Coal ETF, NYSE) tracks global coal mining equities and is used as a
coal price proxy. For the placebo interpretation, an equity proxy is
defensible: if the conflict were a broad macro shock, coal equities
would absorb it too.

Oil is labelled hormuz_exposed because the Strait handles ~21% of
seaborne crude. If oil diverges sharply from non-Hormuz energy
after Feb 28 / Mar 7, it isolates a Hormuz-specific shock rather
than a broad macro energy shock.
"""

import sys
from pathlib import Path
from datetime import date

import numpy as np
import pandas as pd
import yfinance as yf

ROOT      = Path(__file__).resolve().parents[1]
PROCESSED = ROOT / "data" / "processed"
PROCESSED.mkdir(parents=True, exist_ok=True)

START = "2025-11-01"
END   = date.today().isoformat()

COMMODITIES = {
    "BZ=F" : ("Brent Crude",           "hormuz_exposed"),
    "CL=F" : ("WTI Crude",             "hormuz_exposed"),
    "NG=F" : ("Henry Hub Nat Gas",     "non_hormuz_energy"),
    "COAL" : ("Coal Sector (ETF)",     "non_hormuz_energy"),   # VanEck Coal ETF; MTF=F delisted post-Dec 2025
    "ZW=F" : ("CBOT Wheat",            "agriculture"),
    "ZC=F" : ("CBOT Corn",             "agriculture"),
}


def fetch_all() -> pd.DataFrame:
    symbols = list(COMMODITIES.keys())
    print(f"Downloading {len(symbols)} commodity tickers from Yahoo Finance …")
    raw = yf.download(symbols, start=START, end=END, auto_adjust=True, progress=False)

    if raw.empty:
        sys.exit("ERROR: yfinance returned no data.")

    close = raw["Close"].copy()
    close.index = pd.to_datetime(close.index).normalize()
    close.index.name = "date"

    frames = []
    for symbol, (name, category) in COMMODITIES.items():
        if symbol not in close.columns:
            print(f"  [WARN] {symbol} not found in download — skipping")
            continue
        s = close[symbol].dropna()
        df = pd.DataFrame({
            "date"     : s.index,
            "commodity": name,
            "ticker"   : symbol,
            "price"    : s.values,
            "category" : category,
        })
        frames.append(df)

    return pd.concat(frames, ignore_index=True).sort_values(["commodity", "date"])


def print_summary(df: pd.DataFrame) -> None:
    print(f"\n{'─'*55}")
    print("  commodities.csv summary")
    print(f"{'─'*55}")
    print(f"  Rows       : {len(df):,}")
    print(f"  Date range : {df['date'].min().date()} → {df['date'].max().date()}")
    print()
    for (cat, comm), grp in df.groupby(["category", "commodity"]):
        print(f"  [{cat:20s}]  {comm:24s}  "
              f"n={len(grp):3d}  "
              f"min={grp['price'].min():8.2f}  max={grp['price'].max():8.2f}")


def main() -> None:
    df = fetch_all()

    out_path = PROCESSED / "commodities.csv"
    df.to_csv(out_path, index=False)
    print(f"\nSaved → {out_path}")
    print_summary(df)


if __name__ == "__main__":
    main()
