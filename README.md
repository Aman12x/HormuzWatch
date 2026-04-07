# HormuzWatch

Geopolitical impact analytics tracking the real-world economic and humanitarian
effects of the 2026 US-Israel war on Iran (began February 28, 2026).

## Focus Areas

- **Energy markets**: Brent crude, WTI — price shocks, volatility regimes
- **Equities**: Defense contractors, energy majors, tanker/shipping vs. SPY benchmark
- **Macro**: CPI, trade-weighted USD, oil benchmarks from FRED

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env
# edit .env and add your FRED_API_KEY
```

## Running Pipelines

```bash
python pipelines/energy.py
python pipelines/equities.py
python pipelines/macro.py
```

## Data Sources

| Source | Series | Pipeline |
|--------|--------|----------|
| Yahoo Finance | BZ=F, CL=F | energy.py |
| FRED | DCOILBRENTEU | energy.py, macro.py |
| Yahoo Finance | LMT, RTX, NOC, XOM, CVX, BP, FRO, STNG, SPY | equities.py |
| FRED | CPIAUCSL, DTWEXBGS | macro.py |

## Key Date

- **2026-02-28**: Conflict onset — used as event date in event-study analysis
- **Data window**: 2025-11-01 → present (3-month pre-war baseline included)
