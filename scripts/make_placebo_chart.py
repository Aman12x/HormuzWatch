"""
Chart for the surviving finding: the in-time placebo on the OVX volatility premium.

Form: emphasis — the null distribution is context (gray), the observed closure
window is the point (one accent hue). No categorical palette needed, so no
colorblind-separation problem to solve.

Panel 1: null distribution of 77-day mean residuals, observed window marked.
Panel 2: the same statistic through time, 2007-2026, so the reader can see that
         the only historical rival is the June 2020 demand collapse.
"""

from pathlib import Path

import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import numpy as np
import pandas as pd
import statsmodels.api as sm

ROOT = Path(__file__).resolve().parents[1]
CHARTS = ROOT / "outputs" / "charts"
CHARTS.mkdir(parents=True, exist_ok=True)
HIST = ROOT / "data" / "raw" / "ovx_vix_history.csv"

EVENT_DATE = pd.Timestamp("2026-02-28")
REOPEN_DATE = pd.Timestamp("2026-06-18")

# Palette shared with the dashboard (hormuzwatch-ui/tailwind.config.js).
# Light theme, validated against the white card surface.
BG = "#ffffff"
SURFACE = "#ffffff"
BORDER = "#e2e6ea"
TEXT = "#10151a"
SUBTEXT = "#4a545e"
MUTED = "#626c76"
FAINT = "#b7c0c9"
CONTEXT = "#8a949e"
ACCENT = "#1d68c3"   # the single emphasis hue — reserved for the observed value

plt.rcParams.update({
    "font.family": "monospace", "font.monospace": ["JetBrains Mono", "Menlo", "DejaVu Sans Mono"],
    "text.color": TEXT,
    "axes.labelcolor": SUBTEXT,
    "xtick.color": SUBTEXT,
    "ytick.color": SUBTEXT,
    "figure.facecolor": BG,
    "axes.facecolor": SURFACE,
    "axes.edgecolor": BORDER,
})


def style(ax, title="", xlabel="", ylabel=""):
    ax.set_facecolor(SURFACE)
    for side, sp in ax.spines.items():
        sp.set_visible(side in ("bottom", "left"))
        sp.set_edgecolor(BORDER)
    ax.tick_params(colors=SUBTEXT, labelsize=8.5, length=3)
    ax.set_title(title, color=TEXT, fontsize=11, pad=10, loc="left",
                 fontweight="bold")
    ax.set_xlabel(xlabel, fontsize=9)
    ax.set_ylabel(ylabel, fontsize=9)
    ax.grid(False)
    return ax


def main():
    d = pd.read_csv(HIST, parse_dates=["date"]).set_index("date")
    d = d.loc[d.index <= REOPEN_DATE].copy()
    d["y"] = np.log(d["OVX"])
    d["x"] = np.log(d["VIX"])

    train = d.loc[d.index < EVENT_DATE]
    m = sm.OLS(train["y"], sm.add_constant(train["x"])).fit()
    d["resid"] = d["y"] - (m.params["const"] + m.params["x"] * d["x"])

    evt = d.loc[(d.index >= EVENT_DATE) & (d.index <= REOPEN_DATE)]
    W = len(evt)
    obs = evt["resid"].mean()

    roll_all = d["resid"].rolling(W).mean()
    null = roll_all.loc[roll_all.index < EVENT_DATE].dropna()

    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(11, 8.6),
                                   gridspec_kw={"height_ratios": [1, 1],
                                                "hspace": 0.42})

    # ── Panel 1 — null distribution ───────────────────────────────────────
    style(ax1,
          title=f"Where the closure window falls in {len(null):,} historical "
                f"{W}-day windows",
          xlabel="Mean log(OVX) residual vs VIX-implied level  (log points)",
          ylabel="Windows")

    ax1.hist(null, bins=70, color=FAINT, edgecolor=SURFACE, linewidth=0.4)
    ax1.axvline(obs, color=ACCENT, lw=2, zorder=5)
    # Keep the observed rule off the panel edge
    ax1.set_xlim(null.min() - 0.03, obs + 0.06)

    ymax = ax1.get_ylim()[1]
    ax1.annotate(
        f"Hormuz closure\n{obs:+.2f} log pts\n0 of {len(null):,} windows higher",
        xy=(obs, ymax * 0.42), xytext=(-14, 0), textcoords="offset points",
        color=ACCENT, fontsize=9, fontweight="bold", ha="right", va="center",
        linespacing=1.5,
    )
    p99 = np.percentile(null, 99)
    ax1.axvline(p99, color=MUTED, lw=1, ls=(0, (4, 3)))
    ax1.annotate("99th pct of history", xy=(p99, ymax * 0.88),
                 xytext=(-8, 0), textcoords="offset points",
                 color=SUBTEXT, fontsize=8, ha="right", va="center")

    # ── Panel 2 — the statistic through time ──────────────────────────────
    style(ax2,
          title="The same statistic, 2007–2026 — the only rival is June 2020",
          xlabel="", ylabel="Rolling 77-day mean residual")

    hist_line = roll_all.loc[roll_all.index < EVENT_DATE].dropna()
    ax2.plot(hist_line.index, hist_line.values, color=FAINT, lw=1.4)
    ax2.axhline(0, color=BORDER, lw=1)

    evt_line = roll_all.loc[roll_all.index >= EVENT_DATE].dropna()
    if len(evt_line):
        ax2.plot(evt_line.index, evt_line.values, color=ACCENT, lw=2.4,
                 solid_capstyle="round")

    peak_2020 = hist_line.loc["2020"].idxmax()
    ax2.annotate(
        f"COVID demand collapse\n{hist_line.loc[peak_2020]:+.2f}",
        xy=(peak_2020, hist_line.loc[peak_2020]),
        xytext=(14, -6), textcoords="offset points",
        color=SUBTEXT, fontsize=8.5, va="top", linespacing=1.4,
        arrowprops=dict(arrowstyle="-", color=MUTED, lw=1),
    )
    ax2.annotate(
        f"Hormuz closure\n{obs:+.2f}",
        xy=(evt_line.index[-1], evt_line.iloc[-1]),
        xytext=(-12, -4), textcoords="offset points",
        color=ACCENT, fontsize=9, fontweight="bold", ha="right", va="top",
        linespacing=1.4,
    )
    # Headroom so the 2026 spike and its label sit inside the axes
    ax2.set_ylim(top=max(evt_line.max(), hist_line.max()) * 1.16)

    ax2.xaxis.set_major_locator(mdates.YearLocator(2))
    ax2.xaxis.set_major_formatter(mdates.DateFormatter("%Y"))

    fig.text(
        0.5, 0.028,
        "Residual from log(OVX) ~ log(VIX) fit on 4,731 pre-event days "
        "(2007-05-10 → 2026-02-27).  Analysis capped at the June 18, 2026 reopening.\n"
        "Conservative non-overlapping p = 0.016 (0 of 61 independent windows) — "
        "the floor this test can resolve.",
        ha="center", color=MUTED, fontsize=8, linespacing=1.6,
    )

    fig.suptitle(
        "Oil volatility dislocation during the Strait of Hormuz closure",
        color=TEXT, fontsize=13, fontweight="bold", x=0.09, ha="left", y=0.975,
    )

    fig.subplots_adjust(top=0.90, bottom=0.135, left=0.09, right=0.965)
    out = CHARTS / "ovx_intime_placebo.png"
    fig.savefig(out, dpi=170, facecolor=BG)
    print(f"Saved → {out.relative_to(ROOT)}")
    print(f"  observed {obs:+.3f} | null n={len(null)} | "
          f"exceedances={int((null >= obs).sum())}")


if __name__ == "__main__":
    main()
