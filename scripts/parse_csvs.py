"""
parse_csvs.py — HormuzWatch
Reads data/processed/energy.csv and equities.csv,
outputs hormuzwatch-ui/src/data/oilPrices.js and equities.js
as ES module exports.
"""

import json
import sys
import numpy as np
import pandas as pd
from pathlib import Path
from scipy import stats

ROOT      = Path(__file__).resolve().parents[1]
DATA      = ROOT / "data" / "processed"
OUT       = ROOT / "hormuzwatch-ui" / "src" / "data"
OUT.mkdir(parents=True, exist_ok=True)

EVENT_DATE = pd.Timestamp("2026-02-28")
PRE_START  = pd.Timestamp("2025-11-01")
PRE_END    = pd.Timestamp("2026-02-27")

TICKERS = ["LMT", "RTX", "NOC", "XOM", "CVX", "BP", "FRO", "STNG", "HAFNI", "INSW", "NAT", "TK"]
BASKETS = {
    "defense"        : ["LMT", "RTX", "NOC"],
    "energy"         : ["XOM", "CVX", "BP"],
    "shipping_hormuz": ["FRO", "STNG"],
    "shipping_ctrl"  : ["HAFNI", "INSW", "NAT", "TK"],
}

# ── 1. Oil prices ──────────────────────────────────────────────────────────
print("Parsing energy.csv …")
energy_raw = pd.read_csv(DATA / "energy.csv", parse_dates=["date"])
energy_raw["date"] = pd.to_datetime(energy_raw["date"]).dt.normalize()

energy = (
    energy_raw.query("source == 'yfinance'")
    .pivot_table(index="date", columns="series", values="price")
    .rename_axis(None, axis=1)
    .reset_index()
    .rename(columns={"brent": "brent", "wti": "wti"})
    .sort_values("date")
    .dropna(subset=["brent", "wti"])
)

# Find the first trading day on or after Feb 28 (event date)
trading_days_energy = energy["date"].sort_values().reset_index(drop=True)
event_e_idx  = int(np.searchsorted(trading_days_energy, EVENT_DATE))
event_e_date = trading_days_energy.iloc[event_e_idx]
print(f"  Oil event trading day: {event_e_date.date()}")

brent_base = float(energy.loc[energy["date"] == event_e_date, "brent"].values[0])
wti_base   = float(energy.loc[energy["date"] == event_e_date, "wti"].values[0])

energy["brentIdx"] = (energy["brent"] / brent_base * 100).round(2)
energy["wtiIdx"]   = (energy["wti"]   / wti_base   * 100).round(2)
energy["date_str"] = energy["date"].dt.strftime("%Y-%m-%d")

oil_records = energy[["date_str", "brent", "wti", "brentIdx", "wtiIdx"]].rename(
    columns={"date_str": "date", "brent": "brentRaw", "wti": "wtiRaw"}
).to_dict("records")
# round raw prices
for r in oil_records:
    r["brentRaw"] = round(r["brentRaw"], 2)
    r["wtiRaw"]   = round(r["wtiRaw"], 2)

# Event marker dates for reference lines
t2_idx   = int(np.searchsorted(trading_days_energy, pd.Timestamp("2026-03-07")))
t2_date  = trading_days_energy.iloc[min(t2_idx, len(trading_days_energy)-1)].strftime("%Y-%m-%d")

oil_js = (
    f"export const oilPrices = {json.dumps(oil_records, indent=2)};\n\n"
    f"export const oilEventDates = {{\n"
    f'  t1: "{event_e_date.strftime("%Y-%m-%d")}",\n'
    f'  t2: "{t2_date}",\n'
    f"}};\n"
)
(OUT / "oilPrices.js").write_text(oil_js)
print(f"  → oilPrices.js  ({len(oil_records)} rows, base Brent ${brent_base:.2f}, WTI ${wti_base:.2f})")

# ── 2. Equities CAR ────────────────────────────────────────────────────────
print("Parsing equities.csv …")
eq = pd.read_csv(DATA / "equities.csv", parse_dates=["date"])
eq["date"] = pd.to_datetime(eq["date"]).dt.normalize()
eq = eq.sort_values("date").reset_index(drop=True)

trading_days = eq["date"].reset_index(drop=True)
event_idx    = int(np.searchsorted(trading_days, EVENT_DATE))
event_actual = trading_days.iloc[event_idx]
print(f"  Equity event trading day: {event_actual.date()}")

def t_offset(n):
    return trading_days.iloc[max(0, min(event_idx + n, len(trading_days) - 1))]

# Fit OLS on estimation window
est_mask = (eq["date"] >= PRE_START) & (eq["date"] <= PRE_END)
est = eq[est_mask].copy()
models = {}
for t in TICKERS:
    df = est[["SPY_log_ret", f"{t}_log_ret"]].dropna()
    if len(df) < 5:
        models[t] = dict(alpha=0.0, beta=1.0)
        continue
    slope, intercept, r, p, se = stats.linregress(df["SPY_log_ret"].values, df[f"{t}_log_ret"].values)
    models[t] = dict(alpha=intercept, beta=slope, r2=round(r**2, 4))
    print(f"    {t}: β={slope:.3f} R²={r**2:.3f}")

# Event window -5 to +30
ew_start = t_offset(-5)
ew_end   = t_offset(30)
ew_mask  = (eq["date"] >= ew_start) & (eq["date"] <= ew_end)
ew = eq[ew_mask].copy().reset_index(drop=True)

ew_dates_sorted = ew["date"].sort_values().reset_index(drop=True)
day_map = {}
for i, d in enumerate(ew_dates_sorted):
    try:
        event_pos = ew_dates_sorted.tolist().index(event_actual)
        day_map[d] = i - event_pos
    except ValueError:
        day_map[d] = None

ew["t"] = ew["date"].map(day_map)

# Compute AR per ticker
ar_data = {"t": ew["t"].values, "date": ew["date"].values}
for t in TICKERS:
    m   = models[t]
    spy = ew["SPY_log_ret"].fillna(0)
    act = ew[f"{t}_log_ret"].fillna(0)
    exp = m["alpha"] + m["beta"] * spy
    ar_data[t] = (act - exp).values

ar_df = pd.DataFrame(ar_data)

# Cumulative AR per ticker
for t in TICKERS:
    ar_df[f"car_{t}"] = ar_df[t].cumsum()

# Sector averages
for basket, tickers in BASKETS.items():
    ar_df[f"car_{basket}"] = ar_df[[f"car_{t}" for t in tickers]].mean(axis=1)

# Normalize to 0 at t = -1 (last pre-event day) for clean visual
for basket in BASKETS:
    pre_vals = ar_df[ar_df["t"] <= -1][f"car_{basket}"]
    if len(pre_vals) > 0:
        baseline = pre_vals.iloc[-1]
        ar_df[f"car_{basket}"] = ar_df[f"car_{basket}"] - baseline

# Export as percent
records = []
for _, row in ar_df.iterrows():
    if pd.isna(row["t"]):
        continue
    records.append({
        "date"            : pd.Timestamp(row["date"]).strftime("%Y-%m-%d"),
        "t"               : int(row["t"]),
        "defense"         : round(float(row["car_defense"])         * 100, 2),
        "energy"          : round(float(row["car_energy"])          * 100, 2),
        "shipping_hormuz" : round(float(row["car_shipping_hormuz"]) * 100, 2),
        "shipping_ctrl"   : round(float(row["car_shipping_ctrl"])   * 100, 2),
    })

eq_js = f"export const equitiesCAR = {json.dumps(records, indent=2)};\n"
(OUT / "equities.js").write_text(eq_js)
print(f"  → equities.js  ({len(records)} rows, t={records[0]['t']} to t={records[-1]['t']})")

# Final check
hormuz_end  = records[-1]["shipping_hormuz"]
ctrl_end    = records[-1]["shipping_ctrl"]
print(f"\n  Defense CAR at end:         {records[-1]['defense']:+.2f}%")
print(f"  Energy  CAR at end:         {records[-1]['energy']:+.2f}%")
print(f"  Hormuz shipping CAR at end: {hormuz_end:+.2f}%")
print(f"  Non-Hormuz ctrl CAR at end: {ctrl_end:+.2f}%")
print(f"  Gap (Hormuz − Ctrl):        {hormuz_end - ctrl_end:+.2f}pp")
print("\nDone.")
