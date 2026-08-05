"""
In-time placebo test for the OVX volatility premium.

Why this exists
---------------
The original spec regressed OVX on VIX in levels with a post-event dummy and
HC3 errors, reporting p<0.0001. That inference is not supportable: residual
AR(1) is ~0.88, effective sample size is ~10 of 156, and once errors are
AR(1)-corrected the coefficient collapses to +2.4 (p=0.51). Newey-West does not
rescue it at any bandwidth because the residual is near-integrated.

The fix is not a better standard error — it is a better null. Instead of asking
"is this coefficient far from zero under an assumed error process", ask:

    How unusual is a 77-trading-day stretch of OVX running this far above its
    VIX-implied level, relative to every other 77-day stretch since 2007?

That null distribution is built from real data with the real persistence baked
in, so it needs no assumption about the error process at all. It is the
in-time placebo of the synthetic-control literature applied to a time series.

Honest framing of what this can and cannot show
-----------------------------------------------
A high percentile means the closure period was an extreme oil-vol episode by
historical standards. It does NOT isolate Hormuz from the war, from OPEC, or
from any other concurrent oil news. It is a statement about magnitude and
rarity, not about mechanism.
"""

from pathlib import Path

import numpy as np
import pandas as pd
import statsmodels.api as sm

ROOT = Path(__file__).resolve().parents[1]
PROCESSED = ROOT / "data" / "processed"
RAW = ROOT / "data" / "raw"
RAW.mkdir(parents=True, exist_ok=True)

EVENT_DATE = pd.Timestamp("2026-02-28")
REOPEN_DATE = pd.Timestamp("2026-06-18")
HIST_PATH = RAW / "ovx_vix_history.csv"
RULE = "─" * 74


def load_history(refresh: bool = False) -> pd.DataFrame:
    """Load OVX/VIX daily history, fetching once and caching to the repo.

    Cached so the repo reproduces its own numbers without a live network call.
    """
    if HIST_PATH.exists() and not refresh:
        df = pd.read_csv(HIST_PATH, parse_dates=["date"]).set_index("date")
        print(f"Loaded cached history: {HIST_PATH.relative_to(ROOT)}")
        return df

    import yfinance as yf

    print("Fetching ^OVX and ^VIX history from Yahoo Finance…")
    d = yf.download(
        ["^OVX", "^VIX"],
        start="2007-05-10",  # OVX inception
        end="2026-06-19",  # yfinance end is exclusive; analysis ends Jun 18
        auto_adjust=True,
        progress=False,
    )["Close"]
    d.columns = ["OVX", "VIX"]
    d = d.dropna()
    d.index.name = "date"
    d.to_csv(HIST_PATH)
    print(f"Cached → {HIST_PATH.relative_to(ROOT)}  ({len(d)} rows)")
    return d


def run(log_spec: bool = False):
    label = "log(OVX) ~ log(VIX)" if log_spec else "OVX ~ VIX"
    print(f"\n{RULE}\nIN-TIME PLACEBO — {label}\n{RULE}")

    d = load_history()
    d = d.loc[d.index <= REOPEN_DATE].copy()

    if log_spec:
        d["y"] = np.log(d["OVX"])
        d["x"] = np.log(d["VIX"])
        unit = "log pts"
    else:
        d["y"] = d["OVX"]
        d["x"] = d["VIX"]
        unit = "vol pts"

    # ── Fit the OVX~VIX relationship on history EXCLUDING the event window ──
    # Including the event period would let the shock bend the very line it is
    # then measured against.
    train = d.loc[d.index < EVENT_DATE]
    m = sm.OLS(train["y"], sm.add_constant(train["x"])).fit()
    print(f"Relationship fit on {len(train)} pre-event days "
          f"({train.index.min().date()} → {train.index.max().date()})")
    print(f"  {label}:  intercept={m.params['const']:+.3f}  "
          f"slope={m.params['x']:.3f}  R²={m.rsquared:.3f}")

    d["resid"] = d["y"] - (m.params["const"] + m.params["x"] * d["x"])

    # ── The observed event window ─────────────────────────────────────────
    evt = d.loc[(d.index >= EVENT_DATE) & (d.index <= REOPEN_DATE)]
    W = len(evt)
    obs = evt["resid"].mean()
    print(f"\nEvent window: {evt.index.min().date()} → {evt.index.max().date()} "
          f"({W} trading days)")
    print(f"  Mean residual (observed premium): {obs:+.2f} {unit}")

    # ── Null distribution: every W-day window that ends before the event ───
    pre = d.loc[d.index < EVENT_DATE, "resid"]
    roll = pre.rolling(W).mean().dropna()
    n_null = len(roll)

    n_ge = int((roll >= obs).sum())
    p_one = (n_ge + 1) / (n_null + 1)  # +1 correction: observed counts as one draw
    pct = 100 * (1 - p_one)

    print(f"\nNull distribution: {n_null} overlapping {W}-day windows, "
          f"{pre.index.min().date()} → {pre.index.max().date()}")
    print(f"  mean   {roll.mean():+.2f}   sd {roll.std():.2f}")
    print(f"  min    {roll.min():+.2f}   max {roll.max():+.2f}")
    for q in [50, 90, 95, 99]:
        print(f"  p{q:<3}   {np.percentile(roll, q):+.2f}")

    print(f"\n  Windows at least as extreme as observed: {n_ge} of {n_null}")
    print(f"  Empirical one-sided p : {p_one:.4f}")
    print(f"  Percentile            : {pct:.2f}")

    # ── Overlapping windows are not independent draws ─────────────────────
    # 4,655 rolling windows of length 77 contain only ~4655/77 non-overlapping
    # windows. Reporting p=0.0002 off overlapping draws overstates resolution
    # exactly the way the original HC3 errors did. Report the conservative
    # non-overlapping equivalent alongside it.
    n_indep = n_null // W
    disjoint = roll.iloc[::W]
    n_ge_d = int((disjoint >= obs).sum())
    p_disjoint = (n_ge_d + 1) / (len(disjoint) + 1)
    print(f"\n  Non-overlapping equivalent: {len(disjoint)} independent windows "
          f"(~{n_indep} available)")
    print(f"    At least as extreme : {n_ge_d}")
    print(f"    Conservative p      : {p_disjoint:.4f}  "
          f"(finest attainable: {1/(len(disjoint)+1):.4f})")

    # ── What were the historical rivals? ──────────────────────────────────
    top = roll.sort_values(ascending=False).head(8)
    print(f"\n  Most extreme historical windows (window END date):")
    for dt, v in top.items():
        print(f"    {dt.date()}  {v:+.2f} {unit}")

    survives = p_disjoint < 0.05
    print(f"\n  VERDICT: {'SURVIVES' if survives else 'DOES NOT SURVIVE'} "
          f"in-time placebo at 5% on the conservative (non-overlapping) p")
    return {"obs": obs, "p": p_one, "p_disjoint": p_disjoint, "pct": pct,
            "W": W, "n_null": n_null, "n_disjoint": len(disjoint),
            "n_ge": n_ge, "n_ge_d": n_ge_d, "survives": survives, "unit": unit,
            "slope": m.params["x"], "r2": m.rsquared, "top": top,
            "null_mean": roll.mean(), "null_sd": roll.std()}


if __name__ == "__main__":
    lvl = run(log_spec=False)
    lg = run(log_spec=True)
    print(f"\n{RULE}\nSUMMARY\n{RULE}")
    print(f"  Levels spec : premium {lvl['obs']:+.1f} {lvl['unit']}, "
          f"p={lvl['p']:.4f}, {lvl['pct']:.1f}th pct → "
          f"{'KEEP' if lvl['survives'] else 'DEMOTE'}")
    print(f"  Log spec    : premium {lg['obs']:+.3f} {lg['unit']}, "
          f"p={lg['p']:.4f}, {lg['pct']:.1f}th pct → "
          f"{'KEEP' if lg['survives'] else 'DEMOTE'}")
