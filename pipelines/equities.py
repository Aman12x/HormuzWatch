"""
equities.py — HormuzWatch
Pulls daily prices for defense, energy, tanker, and benchmark tickers from
yfinance. Computes daily log returns. Saves to data/processed/equities.csv.

Shipping split:
  hormuz     : FRO, STNG  (Hormuz-exposed VLCC/product tankers)
  non_hormuz : HAFNI, INSW, NAT, TK  (diversified/Atlantic-route control)

Defense split:
  us     : LMT, RTX, NOC  (US prime contractors)
  non_us : BAEL (BA.L), RHM (RHM.DE), LDO (LDO.MI)  (European primes)

Note: BAE Systems trades as BA.L on the LSE (not BAE.L).
"""

import sys
from pathlib import Path
from datetime import date

import numpy as np
import pandas as pd
import yfinance as yf

# ── paths ──────────────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parents[1]
PROCESSED = ROOT / "data" / "processed"
PROCESSED.mkdir(parents=True, exist_ok=True)

START = "2025-11-01"
END = date.today().isoformat()

TICKERS = {
    # US defense
    "LMT":      "defense",
    "RTX":      "defense",
    "NOC":      "defense",
    # European defense
    "BA.L":     "defense",   # BAE Systems — London Stock Exchange
    "RHM.DE":   "defense",   # Rheinmetall — Frankfurt
    "LDO.MI":   "defense",   # Leonardo — Milan
    # Energy majors
    "XOM":      "energy_major",
    "CVX":      "energy_major",
    "BP":       "energy_major",
    # Tankers
    "FRO":      "tanker",
    "STNG":     "tanker",
    "HAFNI.OL": "tanker",    # Hafnia Ltd — Oslo Stock Exchange
    "INSW":     "tanker",
    "NAT":      "tanker",
    "TK":       "tanker",
    # Benchmark
    "SPY":      "benchmark",
}

# Human-readable alias: strip exchange suffix for column names
TICKER_ALIAS = {
    "HAFNI.OL": "HAFNI",
    "BA.L":     "BAEL",    # BAE Systems LSE
    "RHM.DE":   "RHM",     # Rheinmetall
    "LDO.MI":   "LDO",     # Leonardo
}

# Route exposure label per ticker (canonical name, post-alias)
ROUTE_EXPOSURE = {
    "FRO":   "hormuz",
    "STNG":  "hormuz",
    "HAFNI": "non_hormuz",
    "INSW":  "non_hormuz",
    "NAT":   "non_hormuz",
    "TK":    "non_hormuz",
}

# Defense geography label per ticker (canonical name, post-alias)
DEFENSE_EXPOSURE = {
    "LMT":  "us",
    "RTX":  "us",
    "NOC":  "us",
    "BAEL": "non_us",
    "RHM":  "non_us",
    "LDO":  "non_us",
}


def fetch_prices() -> pd.DataFrame:
    symbols = list(TICKERS.keys())
    print(f"Downloading {len(symbols)} tickers from Yahoo Finance …")
    raw = yf.download(symbols, start=START, end=END, auto_adjust=True, progress=False)

    if raw.empty:
        sys.exit("ERROR: yfinance returned no data.")

    close = raw["Close"].copy()
    close.index = pd.to_datetime(close.index).normalize()
    close.index.name = "date"

    # Apply ticker aliases (e.g. HAFNI.OL → HAFNI)
    close.rename(columns=TICKER_ALIAS, inplace=True)
    return close


def compute_log_returns(prices: pd.DataFrame) -> pd.DataFrame:
    log_ret = np.log(prices / prices.shift(1))
    log_ret.columns = [f"{c}_log_ret" for c in log_ret.columns]
    return log_ret


def build_output(prices: pd.DataFrame, log_ret: pd.DataFrame) -> pd.DataFrame:
    df = prices.copy()
    df.columns = [f"{c}_close" for c in df.columns]
    df = pd.concat([df, log_ret], axis=1)
    df.index.name = "date"
    df = df.reset_index()

    # Attach sector + exposure metadata (use canonical/aliased names)
    sector_map = pd.DataFrame([
        {
            "ticker":           TICKER_ALIAS.get(t, t),
            "sector":           s,
            "route_exposure":   ROUTE_EXPOSURE.get(TICKER_ALIAS.get(t, t), ""),
            "defense_exposure": DEFENSE_EXPOSURE.get(TICKER_ALIAS.get(t, t), ""),
        }
        for t, s in TICKERS.items()
    ])
    sector_map.to_csv(PROCESSED / "equities_meta.csv", index=False)

    return df


def print_summary(df: pd.DataFrame) -> None:
    print(f"\n{'─'*50}")
    print("  equities.csv summary")
    print(f"{'─'*50}")
    print(f"  Rows       : {len(df):,}")
    print(f"  Date range : {df['date'].min().date()} → {df['date'].max().date()}")
    close_cols = [c for c in df.columns if c.endswith("_close")]
    print(f"  Tickers    : {len(close_cols)}")
    nulls = df[close_cols].isna().sum()
    if nulls.sum() > 0:
        print(f"  Nulls (close):\n{nulls[nulls > 0].to_string()}")
    else:
        print("  Nulls      : 0")
    for col in close_cols:
        ticker = col.replace("_close", "")
        s = df[col].dropna()
        print(f"  {ticker:6s}  min={s.min():.2f}  max={s.max():.2f}")


def main() -> None:
    prices = fetch_prices()
    log_ret = compute_log_returns(prices)
    out_df = build_output(prices, log_ret)

    out_path = PROCESSED / "equities.csv"
    out_df.to_csv(out_path, index=False)
    print(f"\nSaved → {out_path}")
    print(f"Saved → {PROCESSED / 'equities_meta.csv'}")

    print_summary(out_df)


if __name__ == "__main__":
    main()
