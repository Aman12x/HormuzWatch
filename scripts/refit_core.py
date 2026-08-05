"""
Refit the two candidate 'strong' methods with inference that matches the data.

Prints a verdict for each. Nothing here fetches network data — everything runs
off data/processed/ so the result is reproducible from the committed repo.

Method A — OVX volatility premium
    Original spec regressed OVX on VIX + post dummy in LEVELS with HC3 errors.
    HC3 corrects heteroskedasticity, not serial correlation, and both series are
    highly persistent, so the reported p<0.0001 was not supportable. Here:
      A1. levels + Newey-West (HAC) errors
      A2. levels + Newey-West + GVZ and MOVE as commodity/rates vol controls
      A3. first differences (stationary) + post dummy, HAC errors
    A2 is the specification that answers the actual question: is oil vol elevated
    beyond what equity, gold and rates vol jointly predict?

Method B — Shipping route placebo
    Hormuz-transiting tankers (FRO, STNG) vs non-Hormuz tankers (HAFNI, INSW,
    NAT, TK). Same war, same industry, same freight cycle; differs in route
    exposure. Original reported a raw CAR gap with no standard error at all.
    Here: market-model CARs, then an exact permutation test over all
    C(6,2) = 15 ways to split six tankers into a 2/4 treated/control split.
    With N=2 treated the permutation distribution is the honest inference —
    a t-test on two observations is not.
"""

from pathlib import Path
from itertools import combinations

import numpy as np
import pandas as pd
import statsmodels.api as sm

ROOT = Path(__file__).resolve().parents[1]
PROCESSED = ROOT / "data" / "processed"

EVENT_DATE = pd.Timestamp("2026-02-28")  # US-Israel strikes
HORMUZ_DATE = pd.Timestamp("2026-03-07")  # Strait closure
REOPEN_DATE = pd.Timestamp("2026-06-18")  # Strait reopening — hard analysis cutoff
EST_START = pd.Timestamp("2025-11-01")
EST_END = pd.Timestamp("2026-02-27")

HORMUZ_TANKERS = ["FRO", "STNG"]
CONTROL_TANKERS = ["HAFNI", "INSW", "NAT", "TK"]
ALL_TANKERS = HORMUZ_TANKERS + CONTROL_TANKERS

RULE = "─" * 74


def hac_lags(n: int) -> int:
    """Newey-West bandwidth, Greene's 4*(n/100)^(2/9) rule."""
    return max(1, int(np.floor(4 * (n / 100) ** (2 / 9))))


# ══════════════════════════════════════════════════════════════════════════
# Method A — OVX volatility premium
# ══════════════════════════════════════════════════════════════════════════
def method_a():
    print(f"\n{RULE}\nMETHOD A — OVX volatility premium\n{RULE}")

    vol = pd.read_csv(PROCESSED / "volatility.csv", parse_dates=["date"])
    wide = vol.pivot_table(index="date", columns="series", values="value").sort_index()
    wide = wide.loc[wide.index <= REOPEN_DATE]
    wide = wide[["OVX", "VIX", "GVZ", "MOVE"]].dropna()
    wide["post"] = (wide.index >= EVENT_DATE).astype(float)

    n = len(wide)
    L = hac_lags(n)
    print(f"Observations: {n}   ({wide.index.min().date()} → {wide.index.max().date()})")
    print(f"Newey-West lag truncation: {L}\n")

    # ── A0: the original specification, for comparison ────────────────────
    X0 = sm.add_constant(wide[["VIX", "post"]])
    a0 = sm.OLS(wide["OVX"], X0).fit(cov_type="HC3")

    # ── A1: same spec, HAC errors ─────────────────────────────────────────
    a1 = sm.OLS(wide["OVX"], X0).fit(cov_type="HAC", cov_kwds={"maxlags": L})

    # ── A2: + GVZ and MOVE controls, HAC errors ───────────────────────────
    X2 = sm.add_constant(wide[["VIX", "GVZ", "MOVE", "post"]])
    a2 = sm.OLS(wide["OVX"], X2).fit(cov_type="HAC", cov_kwds={"maxlags": L})

    # ── A3: first differences, HAC errors ─────────────────────────────────
    d = wide[["OVX", "VIX", "GVZ", "MOVE"]].diff().dropna()
    d["post"] = (d.index >= EVENT_DATE).astype(float)
    X3 = sm.add_constant(d[["VIX", "GVZ", "MOVE", "post"]])
    a3 = sm.OLS(d["OVX"], X3).fit(
        cov_type="HAC", cov_kwds={"maxlags": hac_lags(len(d))}
    )

    rows = [
        ("A0  levels, VIX only, HC3        (original)", a0),
        ("A1  levels, VIX only, HAC", a1),
        ("A2  levels, +GVZ +MOVE, HAC", a2),
        ("A3  differences, +GVZ +MOVE, HAC", a3),
    ]
    print(f"  {'Specification':<44} {'beta_post':>10} {'SE':>8} {'p':>9}")
    print(f"  {'─'*44} {'─'*10} {'─'*8} {'─'*9}")
    for label, res in rows:
        b = res.params["post"]
        se = res.bse["post"]
        p = res.pvalues["post"]
        print(f"  {label:<44} {b:>+10.2f} {se:>8.2f} {p:>9.4f}")

    # Durbin-Watson on the original spec, to show why HC3 was wrong
    dw = sm.stats.stattools.durbin_watson(a0.resid)
    rho = 1 - dw / 2
    print(f"\n  Durbin-Watson on A0 residuals : {dw:.3f}  (2.0 = no autocorrelation)")
    print(f"  Implied residual AR(1) rho    : {rho:.3f}")
    print(f"  SE inflation A0 → A1          : {a1.bse['post']/a0.bse['post']:.2f}x")
    print(f"  SE inflation A0 → A2          : {a2.bse['post']/a0.bse['post']:.2f}x")

    # ── A4: HAC bandwidth sensitivity ─────────────────────────────────────
    # Greene's rule gives L=4, but rho≈0.88 means residual dependence decays far
    # more slowly than that. If the result only holds at short bandwidths it is
    # an artefact of undercorrected serial correlation, not a finding.
    print(f"\n  HAC bandwidth sensitivity (spec A2):")
    print(f"    {'maxlags':>8} {'SE':>8} {'t':>8} {'p':>9}")
    print(f"    {'─'*8} {'─'*8} {'─'*8} {'─'*9}")
    band = {}
    for ml in [L, 10, 20, 30, 40, 60]:
        r = sm.OLS(wide["OVX"], X2).fit(cov_type="HAC", cov_kwds={"maxlags": ml})
        band[ml] = (r.bse["post"], r.tvalues["post"], r.pvalues["post"])
        flag = "  ← Greene's rule" if ml == L else ""
        print(f"    {ml:>8} {r.bse['post']:>8.2f} {r.tvalues['post']:>8.2f} "
              f"{r.pvalues['post']:>9.4f}{flag}")

    # ── A5: AR(1)-corrected errors (GLSAR), the direct fix for rho≈0.88 ───
    glsar = sm.GLSAR(wide["OVX"], X2, rho=1).iterative_fit(maxiter=50)
    print(f"\n  GLSAR (AR(1) errors, rho={float(np.ravel(glsar.model.rho)[0]):.3f}): "
          f"beta_post = {glsar.params['post']:+.2f}, "
          f"SE = {glsar.bse['post']:.2f}, p = {glsar.pvalues['post']:.4f}")

    # ── A6: effective sample size after autocorrelation ───────────────────
    n_eff = n * (1 - rho) / (1 + rho)
    print(f"  Effective sample size          : {n_eff:.0f} of {n} "
          f"(autocorrelation-adjusted)")

    b2, p2 = a2.params["post"], a2.pvalues["post"]
    ci = a2.conf_int().loc["post"]
    worst_p = max(v[2] for v in band.values())
    print(f"\n  Headline (A2, L={L}): OVX premium = {b2:+.1f} pts "
          f"[95% CI {ci[0]:+.1f}, {ci[1]:+.1f}], p = {p2:.4f}")
    print(f"  Worst-case p across bandwidths and GLSAR: "
          f"{max(worst_p, glsar.pvalues['post']):.4f}")

    verdict = max(worst_p, glsar.pvalues["post"]) < 0.05
    print(f"\n  VERDICT: {'SURVIVES' if verdict else 'DOES NOT SURVIVE'} "
          f"controls, HAC bandwidth sensitivity and AR(1) errors")
    print("  NOTE: A3 (differences) tests a different hypothesis — whether OVX")
    print("        DRIFTED faster post-event. A one-off persistent level shift")
    print("        should give ~0 there, so A3≈0 is expected, not a refutation.")
    return {"beta": b2, "se": a2.bse["post"], "p": p2,
            "ci": (ci[0], ci[1]), "survives": verdict,
            "a0_p": a0.pvalues["post"], "a0_beta": a0.params["post"],
            "dw": dw, "rho": rho, "n_eff": n_eff,
            "a3_p": a3.pvalues["post"], "a3_beta": a3.params["post"],
            "band": band, "glsar_p": float(glsar.pvalues["post"]),
            "glsar_beta": float(glsar.params["post"]),
            "worst_p": max(worst_p, glsar.pvalues["post"]),
            "n": n, "lags": L}


# ══════════════════════════════════════════════════════════════════════════
# Method B — Shipping route placebo
# ══════════════════════════════════════════════════════════════════════════
def car_by_ticker(eq: pd.DataFrame, tickers, event_end):
    """Market-model CARs vs SPY, estimation window Nov 1 2025 – Feb 27 2026."""
    est = eq.loc[(eq.index >= EST_START) & (eq.index <= EST_END)]
    evt = eq.loc[(eq.index >= EVENT_DATE) & (eq.index <= event_end)]
    out = {}
    diag = {}
    for t in tickers:
        # Drop jointly — a ticker on a foreign calendar (HAFNI/Oslo) has
        # sessions where SPY is missing and vice versa.
        e = est[[f"{t}_log_ret", "SPY_log_ret"]].dropna()
        m = sm.OLS(e[f"{t}_log_ret"], sm.add_constant(e["SPY_log_ret"])).fit()
        v = evt[[f"{t}_log_ret", "SPY_log_ret"]].dropna()
        ar = v[f"{t}_log_ret"] - (
            m.params["const"] + m.params["SPY_log_ret"] * v["SPY_log_ret"]
        )
        out[t] = ar.cumsum()
        diag[t] = {"r2": m.rsquared, "beta": m.params["SPY_log_ret"],
                   "n_est": len(e), "n_evt": len(v),
                   "resid_sd": np.sqrt(m.mse_resid)}
    # Forward-fill across the union calendar so terminal CARs are comparable
    return pd.DataFrame(out).sort_index().ffill(), pd.DataFrame(diag).T


def method_b():
    print(f"\n{RULE}\nMETHOD B — Shipping route placebo\n{RULE}")

    eq = pd.read_csv(PROCESSED / "equities.csv", parse_dates=["date"]).set_index("date")
    eq = eq.loc[eq.index <= REOPEN_DATE]

    # +30 trading days from the event, capped at reopening
    evt_days = eq.loc[eq.index >= EVENT_DATE].index
    t30 = evt_days[min(30, len(evt_days) - 1)]
    print(f"Event window: {EVENT_DATE.date()} → t+30 = {t30.date()}")
    print(f"Estimation window: {EST_START.date()} → {EST_END.date()}\n")

    cars, diag = car_by_ticker(eq, ALL_TANKERS, t30)
    terminal = cars.iloc[-1]

    print("  Market-model fit quality (estimation window):")
    print(f"  {'ticker':<8} {'beta':>7} {'R2':>7} {'resid sd':>10} {'CAR t+30':>10}")
    print(f"  {'─'*8} {'─'*7} {'─'*7} {'─'*10} {'─'*10}")
    for t in ALL_TANKERS:
        mark = "H" if t in HORMUZ_TANKERS else " "
        print(f"  {t:<6}{mark:>2} {diag.loc[t,'beta']:>7.2f} {diag.loc[t,'r2']:>7.3f} "
              f"{diag.loc[t,'resid_sd']:>10.4f} {terminal[t]:>+9.2%}")

    obs_gap = terminal[HORMUZ_TANKERS].mean() - terminal[CONTROL_TANKERS].mean()
    print(f"\n  Hormuz mean CAR    : {terminal[HORMUZ_TANKERS].mean():+.2%}")
    print(f"  Control mean CAR   : {terminal[CONTROL_TANKERS].mean():+.2%}")
    print(f"  Observed gap       : {obs_gap:+.2%}")

    # ── Exact permutation test over all 2/4 splits of the six tankers ─────
    gaps = []
    for combo in combinations(ALL_TANKERS, 2):
        rest = [t for t in ALL_TANKERS if t not in combo]
        gaps.append(terminal[list(combo)].mean() - terminal[rest].mean())
    gaps = np.array(gaps)
    n_perm = len(gaps)
    # one-sided: how many splits produce a gap at least as negative
    rank = int((gaps <= obs_gap).sum())
    p_one = rank / n_perm
    p_two = int((np.abs(gaps) >= abs(obs_gap)).sum()) / n_perm

    print(f"\n  Exact permutation test — all C(6,2) = {n_perm} route splits")
    print(f"    Observed gap rank    : {rank} of {n_perm} (most negative = 1)")
    print(f"    One-sided p          : {p_one:.4f}")
    print(f"    Two-sided p          : {p_two:.4f}")
    print(f"    Permutation gap range: {gaps.min():+.2%} to {gaps.max():+.2%}")

    verdict = p_one <= 0.10
    print(f"\n  VERDICT: {'SURVIVES' if verdict else 'DOES NOT SURVIVE'} "
          f"exact permutation inference")
    if not verdict:
        print("    With 6 tankers the finest attainable p-value is "
              f"{1/n_perm:.4f}; the observed split is not extreme enough.")
    return {"gap": obs_gap, "p_one": p_one, "p_two": p_two, "n_perm": n_perm,
            "rank": rank, "survives": verdict, "t30": t30,
            "hormuz_car": terminal[HORMUZ_TANKERS].mean(),
            "ctrl_car": terminal[CONTROL_TANKERS].mean(),
            "terminal": terminal, "diag": diag,
            "min_p": 1 / n_perm}


if __name__ == "__main__":
    a = method_a()
    b = method_b()
    print(f"\n{RULE}\nSUMMARY\n{RULE}")
    print(f"  Method A (OVX premium)      : "
          f"{'KEEP' if a['survives'] else 'DEMOTE'}")
    print(f"  Method B (shipping placebo) : "
          f"{'KEEP' if b['survives'] else 'DEMOTE'}")
