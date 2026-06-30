import numpy as np
import pandas as pd

import api.compute as compute
from analysis_config import ANALYSIS_END, HORMUZ_REOPENED, YFINANCE_END


def test_yfinance_end_is_exclusive_day_after_cutoff():
    assert ANALYSIS_END == "2026-06-18"
    assert YFINANCE_END == "2026-06-19"


def test_energy_loader_drops_observations_after_reopening(tmp_path, monkeypatch):
    pd.DataFrame(
        [
            {"date": "2026-06-18", "price": 80, "series": "brent", "source": "yfinance"},
            {"date": "2026-06-18", "price": 75, "series": "wti", "source": "yfinance"},
            {"date": "2026-06-19", "price": 81, "series": "brent", "source": "yfinance"},
            {"date": "2026-06-19", "price": 76, "series": "wti", "source": "yfinance"},
        ]
    ).to_csv(tmp_path / "energy.csv", index=False)
    monkeypatch.setattr(compute, "DATA_DIR", tmp_path)

    result = compute._load_energy_yf()
    assert result["date"].max() == pd.Timestamp(HORMUZ_REOPENED)


def test_event_study_drops_observations_after_reopening():
    dates = pd.date_range("2026-02-20", "2026-06-22", freq="B")
    eq = pd.DataFrame({"date": dates, "SPY_log_ret": np.zeros(len(dates))})
    for ticker in compute.TICKERS:
        eq[f"{ticker}_log_ret"] = 0.001
    models = {ticker: {"alpha": 0.0, "beta": 1.0} for ticker in compute.TICKERS}

    result = compute._compute_cars(eq, models)
    assert result["date"].max() <= pd.Timestamp(HORMUZ_REOPENED)
    assert result["t"].max() == 30
