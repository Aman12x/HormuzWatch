"""
Chart for the demotion of the shipping route placebo.

Form: emphasis — the 15 possible route splits are context (gray), the actual
Hormuz/non-Hormuz split is the point (one accent hue). The reader should be able
to see immediately that the real split is not unusual among its own permutations.

This is the falsification, drawn. It belongs in the repo for the same reason the
notebooks do.
"""

from itertools import combinations
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import statsmodels.api as sm

ROOT = Path(__file__).resolve().parents[1]
CHARTS = ROOT / "outputs" / "charts"
CHARTS.mkdir(parents=True, exist_ok=True)

EVENT_DATE = pd.Timestamp("2026-02-28")
REOPEN_DATE = pd.Timestamp("2026-06-18")
EST_START = pd.Timestamp("2025-11-01")
EST_END = pd.Timestamp("2026-02-27")

HORMUZ = ["FRO", "STNG"]
CONTROL = ["HAFNI", "INSW", "NAT", "TK"]
ALL_T = HORMUZ + CONTROL

# Palette shared with the dashboard (hormuzwatch-ui/tailwind.config.js).
# Validated against the dark surface with the data-viz validator.
BG = "#0d0f11"
SURFACE = "#15181c"
BORDER = "#262b31"
TEXT = "#e9ecef"
SUBTEXT = "#a4acb4"
MUTED = "#6b747d"
FAINT = "#333a42"
CONTEXT = "#4b535b"
ACCENT = "#3987e5"   # the single emphasis hue — reserved for the observed value

plt.rcParams.update({
    "font.family": "monospace", "font.monospace": ["JetBrains Mono", "Menlo", "DejaVu Sans Mono"], "text.color": TEXT,
    "axes.labelcolor": SUBTEXT, "xtick.color": SUBTEXT, "ytick.color": SUBTEXT,
    "figure.facecolor": BG, "axes.facecolor": SURFACE, "axes.edgecolor": BORDER,
})


def main():
    eq = pd.read_csv(ROOT / "data/processed/equities.csv",
                     parse_dates=["date"]).set_index("date")
    eq = eq.loc[eq.index <= REOPEN_DATE]
    est = eq.loc[(eq.index >= EST_START) & (eq.index <= EST_END)]
    evt_days = eq.loc[eq.index >= EVENT_DATE].index
    t30 = evt_days[min(30, len(evt_days) - 1)]
    evt = eq.loc[(eq.index >= EVENT_DATE) & (eq.index <= t30)]

    car, r2 = {}, {}
    for t in ALL_T:
        e = est[[f"{t}_log_ret", "SPY_log_ret"]].dropna()
        m = sm.OLS(e[f"{t}_log_ret"], sm.add_constant(e["SPY_log_ret"])).fit()
        v = evt[[f"{t}_log_ret", "SPY_log_ret"]].dropna()
        ar = v[f"{t}_log_ret"] - (m.params["const"]
                                  + m.params["SPY_log_ret"] * v["SPY_log_ret"])
        car[t] = ar.sum()
        r2[t] = m.rsquared

    splits = []
    for combo in combinations(ALL_T, 2):
        rest = [t for t in ALL_T if t not in combo]
        gap = np.mean([car[t] for t in combo]) - np.mean([car[t] for t in rest])
        splits.append((combo, gap))
    splits.sort(key=lambda s: s[1])

    obs_combo = tuple(HORMUZ)
    obs_gap = next(g for c, g in splits if set(c) == set(obs_combo))
    rank = [i for i, (c, _) in enumerate(splits) if set(c) == set(obs_combo)][0] + 1
    p_one = sum(1 for _, g in splits if g <= obs_gap) / len(splits)

    fig, ax = plt.subplots(figsize=(11, 6.4))
    ax.set_facecolor(SURFACE)
    for side, sp in ax.spines.items():
        sp.set_visible(side in ("bottom", "left"))
        sp.set_edgecolor(BORDER)
    ax.tick_params(colors=SUBTEXT, labelsize=8.5, length=3)
    ax.grid(False)

    labels = [f"{c[0]} + {c[1]}" for c, _ in splits]
    vals = [g * 100 for _, g in splits]
    colors = [ACCENT if set(c) == set(obs_combo) else FAINT for c, _ in splits]

    ypos = np.arange(len(splits))
    ax.barh(ypos, vals, color=colors, height=0.68)
    ax.set_yticks(ypos)
    ax.set_yticklabels(labels, fontsize=8.5)
    for tick, (c, _) in zip(ax.get_yticklabels(), splits):
        tick.set_color(ACCENT if set(c) == set(obs_combo) else SUBTEXT)
    ax.axvline(0, color=BORDER, lw=1)

    # Park the callout in the empty positive-x region beside the lowest bars
    ax.annotate(
        f"the actual Hormuz split\n{obs_gap*100:+.2f}pp · rank {rank} of "
        f"{len(splits)} · p = {p_one:.3f}",
        xy=(obs_gap * 100, ypos[rank - 1]),
        xytext=(max(vals) * 0.30, ypos[rank - 1]),
        textcoords="data", color=ACCENT, fontsize=9.5, ha="left", va="center",
        fontweight="bold", linespacing=1.6,
        arrowprops=dict(arrowstyle="-", color=ACCENT, lw=1.1,
                        shrinkA=0, shrinkB=4),
    )

    ax.set_title(
        "Splitting six tankers into 2 treated / 4 control, every possible way",
        color=TEXT, fontsize=12, pad=12, loc="left", fontweight="bold",
    )
    ax.set_xlabel("Cumulative abnormal return gap at t+30 (percentage points)",
                  fontsize=9)

    fig.text(
        0.5, 0.028,
        "If route exposure drove the gap, the real Hormuz split should be the "
        "extreme one. It ranks second of fifteen.\n"
        "With six tankers the smallest attainable p-value is 0.067, so this "
        f"design cannot reach 5% at any effect size.  Market-model R² across the "
        f"six: {min(r2.values()):.3f}–{max(r2.values()):.3f}.",
        ha="center", color=MUTED, fontsize=8, linespacing=1.7,
    )

    fig.subplots_adjust(top=0.91, bottom=0.20, left=0.135, right=0.965)
    out = CHARTS / "shipping_permutation.png"
    fig.savefig(out, dpi=170, facecolor=BG)
    print(f"Saved → {out.relative_to(ROOT)}")
    print(f"  observed {obs_gap*100:+.2f}pp | rank {rank}/{len(splits)} | p={p_one:.4f}")


if __name__ == "__main__":
    main()
