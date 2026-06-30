"""Rebuild synthetic-control donor panels through the fixed analysis cutoff."""

from pathlib import Path

import pandas as pd

from analysis_config import ANALYSIS_END

ROOT = Path(__file__).resolve().parents[1]
PROCESSED = ROOT / "data" / "processed"
START = "2025-11-01"


def fetch_fred(series_id: str, label: str) -> pd.DataFrame:
    url = (
        "https://fred.stlouisfed.org/graph/fredgraph.csv"
        f"?id={series_id}&cosd={START}&coed={ANALYSIS_END}"
    )
    frame = pd.read_csv(url, parse_dates=["observation_date"])
    frame[series_id] = pd.to_numeric(frame[series_id], errors="coerce")
    return frame.rename(columns={"observation_date": "date", series_id: label})


def main() -> None:
    brent = fetch_fred("DCOILBRENTEU", "fred_brent")
    henry = fetch_fred("DHHNGSP", "henry_hub")
    fred_wti = fetch_fred("DCOILWTICO", "fred_wti")
    dubai = fetch_fred("POILDUBUSDM", "dubai")

    donors = brent.merge(henry, on="date", how="outer").sort_values("date")
    donors = donors[donors["date"] <= pd.Timestamp(ANALYSIS_END)]
    donors.to_csv(PROCESSED / "donors.csv", index=False)

    energy = pd.read_csv(PROCESSED / "energy.csv", parse_dates=["date"])
    energy = (
        energy.query("source == 'yfinance'")
        .pivot_table(index="date", columns="series", values="price")
        .rename(columns={"brent": "brent_yf", "wti": "wti_yf"})
        .reset_index()
    )

    daily = pd.DataFrame({"date": pd.date_range(START, ANALYSIS_END, freq="D")})
    dubai_daily = daily.merge(dubai, on="date", how="left")
    dubai_daily["dubai_interp"] = (
        dubai_daily.set_index("date")["dubai"].interpolate(method="time").ffill()
        .to_numpy()
    )

    extended = (
        energy.merge(brent, on="date", how="left")
        .merge(dubai_daily[["date", "dubai_interp"]], on="date", how="left")
        .merge(fred_wti, on="date", how="left")
        .sort_values("date")
    )
    extended[["fred_brent", "dubai_interp", "fred_wti"]] = extended[
        ["fred_brent", "dubai_interp", "fred_wti"]
    ].ffill()
    extended.to_csv(PROCESSED / "donors_extended.csv", index=False)

    print(f"Saved donors.csv ({len(donors)} rows)")
    print(f"Saved donors_extended.csv ({len(extended)} rows through {ANALYSIS_END})")


if __name__ == "__main__":
    main()
