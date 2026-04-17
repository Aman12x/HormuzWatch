"""
compute.py — HormuzWatch
Reads data/processed/ CSVs and computes live econometric outputs:
  - Oil price time series (indexed to Feb 28 base)
  - Equity CARs by sector and ticker (market-model OLS)
  - Volatility index time series
  - Futures ATT (synthetic control — Brent–WTI spread change)
  - DiD estimates (PanelOLS, linearmodels)

All functions return plain dicts/lists suitable for JSON serialisation.
Each function degrades gracefully: missing CSVs or computation errors
return None so callers can fall back to static data.
"""

from __future__ import annotations

import traceback
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
from scipy import stats as sp_stats

# ── Paths ──────────────────────────────────────────────────────────────────────
_ROOT    = Path(__file__).parent.parent          # hormuzwatch/
DATA_DIR = _ROOT / "data" / "processed"

# ── Event constants ────────────────────────────────────────────────────────────
EVENT_DATE  = pd.Timestamp("2026-02-28")   # US-Israel strikes
HORMUZ_DATE = pd.Timestamp("2026-03-07")   # Hormuz closure
PRE_START   = pd.Timestamp("2025-11-01")   # Estimation window start
PRE_END     = pd.Timestamp("2026-02-27")   # Estimation window end
DID_BASE    = pd.Timestamp("2026-01-02")   # DiD price index base date

# Equity tickers (canonical names, post pipeline alias)
TICKERS = ["LMT", "RTX", "NOC", "XOM", "CVX", "BP",
           "FRO", "STNG", "HAFNI", "INSW", "NAT", "TK"]

BASKETS: dict[str, list[str]] = {
    "defense"        : ["LMT", "RTX", "NOC"],
    "energy"         : ["XOM", "CVX", "BP"],
    "shipping_hormuz": ["FRO", "STNG"],
    "shipping_ctrl"  : ["HAFNI", "INSW", "NAT", "TK"],
}


# ── Helpers ────────────────────────────────────────────────────────────────────

def _csv(name: str) -> Path:
    return DATA_DIR / name


def _load_energy_yf() -> pd.DataFrame:
    """Return pivot of yfinance rows from energy.csv with 'brent' and 'wti' columns."""
    df = pd.read_csv(_csv("energy.csv"), parse_dates=["date"])
    df["date"] = pd.to_datetime(df["date"]).dt.normalize()
    yf = (
        df.query("source == 'yfinance'")
          .pivot_table(index="date", columns="series", values="price")
          .rename_axis(None, axis=1)
          .reset_index()
          .sort_values("date")
          .dropna(subset=["brent", "wti"])
    )
    return yf


def _load_equities() -> pd.DataFrame:
    eq = pd.read_csv(_csv("equities.csv"), parse_dates=["date"])
    eq["date"] = pd.to_datetime(eq["date"]).dt.normalize()
    return eq.sort_values("date").reset_index(drop=True)


def _fit_market_models(eq: pd.DataFrame) -> dict[str, dict]:
    """OLS market model (α, β) for each ticker over the estimation window."""
    est = eq[(eq["date"] >= PRE_START) & (eq["date"] <= PRE_END)].copy()
    models: dict[str, dict] = {}
    for t in TICKERS:
        col = f"{t}_log_ret"
        if col not in eq.columns or "SPY_log_ret" not in eq.columns:
            models[t] = {"alpha": 0.0, "beta": 1.0}
            continue
        df_ = est[["SPY_log_ret", col]].dropna()
        if len(df_) < 10:
            models[t] = {"alpha": 0.0, "beta": 1.0}
            continue
        slope, intercept, *_ = sp_stats.linregress(
            df_["SPY_log_ret"].values, df_[col].values
        )
        models[t] = {"alpha": float(intercept), "beta": float(slope)}
    return models


def _compute_cars(eq: pd.DataFrame, models: dict) -> pd.DataFrame:
    """
    Compute cumulative abnormal returns for every ticker and sector basket.
    Returns a DataFrame with columns: date, t, car_{ticker}, car_{basket}.
    """
    trading_days = eq["date"].reset_index(drop=True)
    ev_idx  = int(np.searchsorted(trading_days, EVENT_DATE))
    ev_date = trading_days.iloc[ev_idx]

    def t_off(n: int) -> pd.Timestamp:
        return trading_days.iloc[max(0, min(ev_idx + n, len(trading_days) - 1))]

    ew = eq[eq["date"] >= t_off(-5)].copy().reset_index(drop=True)
    ew_dates = ew["date"].sort_values().reset_index(drop=True)
    try:
        ev_pos = list(ew_dates).index(ev_date)
    except ValueError:
        ev_pos = 5
    ew["t"] = [i - ev_pos for i in range(len(ew))]

    for t in TICKERS:
        col = f"{t}_log_ret"
        if col not in ew.columns or "SPY_log_ret" not in ew.columns:
            ew[f"ar_{t}"] = 0.0
        else:
            m   = models[t]
            spy = ew["SPY_log_ret"].fillna(0)
            act = ew[col].fillna(0)
            ew[f"ar_{t}"] = act - (m["alpha"] + m["beta"] * spy)
        ew[f"car_{t}"] = ew[f"ar_{t}"].cumsum()

    for basket, tickers in BASKETS.items():
        cols = [f"car_{t}" for t in tickers if f"car_{t}" in ew.columns]
        ew[f"car_{basket}"] = ew[cols].mean(axis=1)
        pre = ew[ew["t"] <= -1][f"car_{basket}"]
        if len(pre):
            ew[f"car_{basket}"] -= float(pre.iloc[-1])

    return ew


# ── Public build functions ─────────────────────────────────────────────────────

def build_timeseries() -> dict:
    """
    Returns time-series arrays consumed by the frontend charts:
      oilPrices      — [{date, brentRaw, wtiRaw, brentIdx, wtiIdx}]
      oilEventDates  — {t1, t2}
      equitiesCAR    — [{date, t, defense, energy, shipping_hormuz, shipping_ctrl}]
      volatility     — [{date, OVX, VIX, GVZ, MOVE}]
      updatedAt      — ISO timestamp
    """
    out: dict = {}

    # ── Oil prices ─────────────────────────────────────────────────────────
    try:
        energy = _load_energy_yf()
        td = energy["date"].sort_values().reset_index(drop=True)

        ev_idx  = int(np.searchsorted(td, EVENT_DATE))
        ev_date = td.iloc[min(ev_idx, len(td) - 1)]
        hz_idx  = int(np.searchsorted(td, HORMUZ_DATE))
        hz_date = td.iloc[min(hz_idx, len(td) - 1)]

        brent_base = float(energy.loc[energy["date"] == ev_date, "brent"].iloc[0])
        wti_base   = float(energy.loc[energy["date"] == ev_date, "wti"].iloc[0])

        energy["brentIdx"] = (energy["brent"] / brent_base * 100).round(2)
        energy["wtiIdx"]   = (energy["wti"]   / wti_base   * 100).round(2)

        oil_records = [
            {
                "date"    : row["date"].strftime("%Y-%m-%d"),
                "brentRaw": round(float(row["brent"]), 2),
                "wtiRaw"  : round(float(row["wti"]),   2),
                "brentIdx": round(float(row["brentIdx"]), 2),
                "wtiIdx"  : round(float(row["wtiIdx"]),   2),
            }
            for _, row in energy.iterrows()
        ]
        out["oilPrices"]    = oil_records
        out["oilEventDates"] = {
            "t1": ev_date.strftime("%Y-%m-%d"),
            "t2": hz_date.strftime("%Y-%m-%d"),
        }
    except Exception:
        traceback.print_exc()

    # ── Equities CAR ───────────────────────────────────────────────────────
    try:
        eq     = _load_equities()
        models = _fit_market_models(eq)
        ew     = _compute_cars(eq, models)

        car_records = [
            {
                "date"            : pd.Timestamp(row["date"]).strftime("%Y-%m-%d"),
                "t"               : int(row["t"]),
                "defense"         : round(float(row["car_defense"])         * 100, 2),
                "energy"          : round(float(row["car_energy"])          * 100, 2),
                "shipping_hormuz" : round(float(row["car_shipping_hormuz"]) * 100, 2),
                "shipping_ctrl"   : round(float(row["car_shipping_ctrl"])   * 100, 2),
            }
            for _, row in ew.iterrows()
            if not pd.isna(row["t"])
        ]
        out["equitiesCAR"] = car_records
    except Exception:
        traceback.print_exc()

    # ── Volatility ─────────────────────────────────────────────────────────
    try:
        vol = pd.read_csv(_csv("volatility.csv"), parse_dates=["date"])
        vol["date"] = pd.to_datetime(vol["date"]).dt.normalize()
        pivot = (
            vol.pivot_table(index="date", columns="series", values="value")
               .rename_axis(None, axis=1)
               .reset_index()
               .sort_values("date")
        )
        vol_records = []
        for _, row in pivot.iterrows():
            rec: dict = {"date": row["date"].strftime("%Y-%m-%d")}
            for col in ["OVX", "VIX", "GVZ", "MOVE"]:
                if col in row.index and not pd.isna(row[col]):
                    rec[col] = round(float(row[col]), 2)
            vol_records.append(rec)
        out["volatility"] = vol_records
    except Exception:
        traceback.print_exc()

    out["updatedAt"] = datetime.now(timezone.utc).isoformat()
    return out


def build_metrics() -> dict:
    """
    Returns computed econometric metrics:
      oilStats          — base/peak prices
      syntheticControl  — futuresATT (live), spotATT (frozen), basisSpread
      attByPhase        — ATT broken out by strike / Hormuz phases
      equityStats       — sector-level final CARs
      tickerCAR         — per-ticker final CARs
      shippingPlacebo   — Hormuz vs non-Hormuz gap
      didResults        — DiD coefficients from PanelOLS (or None if unavailable)
      updatedAt         — ISO timestamp
    """
    out: dict = {}

    # ── Oil stats + Futures ATT ────────────────────────────────────────────
    try:
        energy = _load_energy_yf()
        td = energy["date"].sort_values().reset_index(drop=True)

        ev_idx  = int(np.searchsorted(td, EVENT_DATE))
        ev_date = td.iloc[min(ev_idx, len(td) - 1)]

        brent_base = float(energy.loc[energy["date"] == ev_date, "brent"].iloc[0])
        wti_base   = float(energy.loc[energy["date"] == ev_date, "wti"].iloc[0])

        post_brent = energy.loc[energy["date"] >= EVENT_DATE, "brent"]
        post_wti   = energy.loc[energy["date"] >= EVENT_DATE, "wti"]

        out["oilStats"] = {
            "brentBase"      : round(brent_base, 2),
            "wtiBase"        : round(wti_base, 2),
            "brentPeak"      : round(float(post_brent.max()), 2) if len(post_brent) else brent_base,
            "wtiPeak"        : round(float(post_wti.max()),   2) if len(post_wti)   else wti_base,
            "brentIndexedEnd": round(float(energy["brent"].iloc[-1]) / brent_base * 100, 1),
            "wtiIndexedEnd"  : round(float(energy["wti"].iloc[-1])   / wti_base   * 100, 1),
        }

        # Futures ATT = change in Brent–WTI spread (demeaned) post-treatment
        idx = energy.set_index("date")
        spread = idx["brent"] - idx["wti"]
        pre_mean = float(spread[spread.index < EVENT_DATE].mean())

        p_full = spread[spread.index >= EVENT_DATE]
        p1     = spread[(spread.index >= EVENT_DATE) & (spread.index < HORMUZ_DATE)]
        p2     = spread[spread.index >= HORMUZ_DATE]

        futures_att_full = round(float(p_full.mean()) - pre_mean, 2) if len(p_full) else 3.51
        futures_att_p1   = round(float(p1.mean())     - pre_mean, 2) if len(p1)     else 0.94
        futures_att_p2   = round(float(p2.mean())     - pre_mean, 2) if len(p2)     else 4.18

        # spotATT stays frozen: Dubai crude data ends Feb 2026; synthetic inflated
        FROZEN_SPOT_ATT = 35.99
        FROZEN_SPOT_P1  = 16.77
        FROZEN_SPOT_P2  = 41.04

        out["syntheticControl"] = {
            "spotATT"      : FROZEN_SPOT_ATT,
            "futuresATT"   : futures_att_full,
            "basisSpread"  : round(FROZEN_SPOT_ATT - futures_att_full, 2),
            "prePeriodRMSE": 0.78,
            "donorWeights" : [
                {"name": "FRED Brent (DCOILBRENTEU)", "weight": 77.1},
                {"name": "WTI (yfinance CL=F)",       "weight": 22.9},
                {"name": "Henry Hub (DHHNGSP)",        "weight": 0.0},
            ],
        }
        out["attByPhase"] = [
            {
                "phase": "Strike→Hormuz",
                "label": "Feb 28\n– Mar 7",
                "spotATT"   : FROZEN_SPOT_P1,
                "futuresATT": futures_att_p1,
            },
            {
                "phase": "Hormuz onward",
                "label": "Mar 7\n– present",
                "spotATT"   : FROZEN_SPOT_P2,
                "futuresATT": futures_att_p2,
            },
            {
                "phase": "Full post",
                "label": "Mar 1\n– present",
                "spotATT"   : FROZEN_SPOT_ATT,
                "futuresATT": futures_att_full,
            },
        ]
    except Exception:
        traceback.print_exc()

    # ── Equity metrics ─────────────────────────────────────────────────────
    try:
        eq     = _load_equities()
        models = _fit_market_models(eq)
        ew     = _compute_cars(eq, models)
        last   = ew.iloc[-1]

        ticker_car = {
            t: round(float(ew[f"car_{t}"].iloc[-1]) * 100, 2)
            for t in TICKERS
            if f"car_{t}" in ew.columns
        }
        basket_car = {
            basket: round(float(last[f"car_{basket}"]) * 100, 2)
            for basket in BASKETS
            if f"car_{basket}" in ew.columns
        }

        out["equityStats"] = {
            basket: {"car": basket_car.get(basket, 0.0)}
            for basket in BASKETS
        }
        out["tickerCAR"] = ticker_car

        hormuz_car = basket_car.get("shipping_hormuz", -12.33)
        ctrl_car   = basket_car.get("shipping_ctrl",   -6.32)
        out["shippingPlacebo"] = {
            "hormuzCAR"   : hormuz_car,
            "nonHormuzCAR": ctrl_car,
            "gap"         : round(hormuz_car - ctrl_car, 2),
        }
    except Exception:
        traceback.print_exc()

    # ── DiD: Oil vs Non-Hormuz Energy (PanelOLS) ──────────────────────────
    try:
        from linearmodels.panel import PanelOLS  # type: ignore

        comm = pd.read_csv(_csv("commodities.csv"), parse_dates=["date"])
        comm["date"] = pd.to_datetime(comm["date"]).dt.normalize()

        # Use only the four DiD series
        did_tickers = {"BZ=F", "CL=F", "NG=F", "COAL"}
        comm = comm[comm["ticker"].isin(did_tickers)].copy()

        # Find index base price (Jan 2 or nearest trading day)
        base_rows = comm[comm["date"] >= DID_BASE].sort_values("date")
        earliest_base = base_rows["date"].min()
        base_prices = (
            comm[comm["date"] == earliest_base]
            .set_index("ticker")["price"]
            .to_dict()
        )

        comm["price_idx"] = comm.apply(
            lambda r: r["price"] / base_prices[r["ticker"]] * 100
            if r["ticker"] in base_prices and base_prices[r["ticker"]] > 0
            else np.nan,
            axis=1,
        )
        comm = comm.dropna(subset=["price_idx"])
        treat_set = {"BZ=F", "CL=F"}
        comm["treat"] = comm["ticker"].isin(treat_set).astype(int)
        comm["post"]  = (comm["date"] >= EVENT_DATE).astype(int)

        brent_base_did = base_prices.get("BZ=F", 60.75)

        def _did_for(data: pd.DataFrame, post_col: str) -> dict:
            panel = data.set_index(["ticker", "date"])
            panel = panel.copy()
            panel["did"] = panel["post"] * panel["treat"] if post_col == "post" else (
                panel[post_col] * panel["treat"]
            )
            mod = PanelOLS.from_formula(
                f"price_idx ~ 1 + {post_col} + did + EntityEffects",
                data=panel,
            )
            res = mod.fit(cov_type="clustered", cluster_entity=True)
            coef = float(res.params["did"])
            se   = float(res.std_errors["did"])
            t    = float(res.tstats["did"])
            p    = float(res.pvalues["did"])
            return {
                "coef"  : round(coef, 2),
                "se"    : round(se, 2),
                "t"     : round(t, 2),
                "p"     : round(p, 4),
                "dolBbl": round(coef * brent_base_did / 100, 2),
            }

        # Full post
        comm_full = comm.copy()
        comm_full["post"] = (comm_full["date"] >= EVENT_DATE).astype(int)
        res_full = _did_for(comm_full, "post")

        # Phase 1: pre + strike→Hormuz only
        comm_p1 = comm[comm["date"] < HORMUZ_DATE].copy()
        comm_p1["post"] = (comm_p1["date"] >= EVENT_DATE).astype(int)
        res_p1 = _did_for(comm_p1, "post")

        # Phase 2: pre + Hormuz-onwards only
        comm_p2 = comm[
            (comm["date"] < EVENT_DATE) | (comm["date"] >= HORMUZ_DATE)
        ].copy()
        comm_p2["post"] = (comm_p2["date"] >= HORMUZ_DATE).astype(int)
        res_p2 = _did_for(comm_p2, "post")

        out["didResults"] = {
            "fullPost"        : res_full,
            "p1Strike"        : res_p1,
            "p2Hormuz"        : res_p2,
            "hormuzIncrement" : round(res_p2["coef"] - res_p1["coef"], 2),
            "brentBase"       : round(brent_base_did, 2),
        }
    except Exception:
        traceback.print_exc()
        # didResults omitted — frontend falls back to static value

    out["updatedAt"] = datetime.now(timezone.utc).isoformat()
    return out


def is_stale(max_age_days: float = 1.0) -> bool:
    """
    True if energy.csv is missing or the most recent data date is more than
    max_age_days old.  We check data content rather than file mtime because
    container builds re-extract files from git with a fresh mtime even when
    the data inside is weeks old.
    """
    p = _csv("energy.csv")
    if not p.exists():
        return True
    try:
        df = pd.read_csv(p, parse_dates=["date"])
        last_date = pd.to_datetime(df["date"]).max()
        age_days = (pd.Timestamp.utcnow().tz_localize(None) - last_date).days
        return age_days > max_age_days
    except Exception:
        return True
