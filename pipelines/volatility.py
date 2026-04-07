"""
volatility.py — HormuzWatch
Pulls four volatility indices from yfinance.
Saves to data/processed/volatility.csv.

Series and categories
─────────────────────
  oil_vol              : ^OVX   (CBOE Crude Oil Volatility Index)
  broad_market         : ^VIX   (CBOE Volatility Index — S&P 500)
  commodity_vol_ctrl   : ^GVZ   (CBOE Gold Volatility Index)
  rates_vol_ctrl       : ^MOVE  (ICE BofA MOVE Index — Treasury vol)

Note: ^VXTYN (Cboe/CBOT Treasury Note Volatility) is delisted on
yfinance. ^MOVE is the market standard for rates volatility and
is more widely cited in practice.

vol indices are not auto_adjust eligible; downloaded with
auto_adjust=False and Close column used directly.
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

VOL_SERIES = {
    "^OVX" : ("OVX",  "CBOE Oil Volatility",        "oil_vol"),
    "^VIX" : ("VIX",  "CBOE VIX (S&P 500)",         "broad_market"),
    "^GVZ" : ("GVZ",  "CBOE Gold Volatility",        "commodity_vol_ctrl"),
    "^MOVE": ("MOVE", "ICE BofA MOVE (Treasury vol)", "rates_vol_ctrl"),
}


def fetch_all() -> pd.DataFrame:
    symbols = list(VOL_SERIES.keys())
    print(f"Downloading {len(symbols)} volatility indices …")
    # Vol indices are not price-adjusted instruments
    raw = yf.download(symbols, start=START, end=END, auto_adjust=False, progress=False)

    if raw.empty:
        sys.exit("ERROR: yfinance returned no data.")

    close = raw["Close"].copy()
    close.index = pd.to_datetime(close.index).normalize()
    close.index.name = "date"

    # Flatten MultiIndex if present
    if isinstance(close.columns, pd.MultiIndex):
        close.columns = close.columns.get_level_values(0)

    frames = []
    for ticker, (name, description, category) in VOL_SERIES.items():
        if ticker not in close.columns:
            print(f"  [WARN] {ticker} not in download — skipping")
            continue
        s = close[ticker].dropna()
        df = pd.DataFrame({
            "date"       : s.index,
            "series"     : name,
            "ticker"     : ticker,
            "value"      : s.values,
            "description": description,
            "category"   : category,
        })
        frames.append(df)
        print(f"  {ticker:8s} ({name:5s})  n={len(s):3d}  "
              f"min={s.min():.1f}  max={s.max():.1f}")

    return pd.concat(frames, ignore_index=True).sort_values(["series", "date"])


def main() -> None:
    df = fetch_all()
    out_path = PROCESSED / "volatility.csv"
    df.to_csv(out_path, index=False)
    print(f"\nSaved → {out_path}  ({len(df):,} rows)")


if __name__ == "__main__":
    main()
