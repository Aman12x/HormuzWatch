"""The June 18 2026 reopening is a hard boundary — assert nothing crosses it.

The FastAPI layer these tests used to exercise was retired when the project was
archived, so the cutoff is now enforced where it still matters: the shared date
config, the committed datasets, and the two analysis scripts.
"""

from pathlib import Path

import pandas as pd
import pytest

from analysis_config import ANALYSIS_END, HORMUZ_REOPENED, YFINANCE_END

ROOT = Path(__file__).resolve().parents[1]
PROCESSED = ROOT / "data" / "processed"
CUTOFF = pd.Timestamp(HORMUZ_REOPENED)

DATED_CSVS = [
    "commodities.csv",
    "energy.csv",
    "equities.csv",
    "food_fertilizer.csv",
    "macro.csv",
    "volatility.csv",
]


def test_yfinance_end_is_exclusive_day_after_cutoff():
    assert ANALYSIS_END == "2026-06-18"
    assert YFINANCE_END == "2026-06-19"


@pytest.mark.parametrize("name", DATED_CSVS)
def test_processed_dataset_stops_at_reopening(name):
    path = PROCESSED / name
    if not path.exists():
        pytest.skip(f"{name} not present")
    df = pd.read_csv(path, parse_dates=["date"])
    assert df["date"].max() <= CUTOFF, (
        f"{name} contains observations after the {ANALYSIS_END} reopening"
    )


def test_ovx_history_cache_is_not_truncated_before_the_event():
    """The placebo needs history BEFORE the event; only the tail is capped."""
    path = ROOT / "data" / "raw" / "ovx_vix_history.csv"
    if not path.exists():
        pytest.skip("history cache not fetched yet")
    df = pd.read_csv(path, parse_dates=["date"])
    assert df["date"].max() <= CUTOFF
    assert df["date"].min() <= pd.Timestamp("2007-12-31"), (
        "in-time placebo needs the full OVX record back to 2007"
    )
    assert len(df) > 4000


def test_refit_and_placebo_scripts_declare_the_cutoff():
    """Guard against a future edit that quietly extends the window."""
    for script in ["refit_core.py", "ovx_placebo.py", "make_placebo_chart.py"]:
        src = (ROOT / "scripts" / script).read_text()
        assert "2026-06-18" in src, f"{script} does not pin the reopening date"
