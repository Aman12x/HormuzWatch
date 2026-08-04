# HormuzWatch

**Causal inference pipeline quantifying the global economic and humanitarian impact of the 2026 US-Israel war on Iran, capped at the Strait of Hormuz reopening on June 18, 2026.**

**Live dashboard: [hormuzwatch.singhaman.dev](https://hormuzwatch.singhaman.dev)**

Six independent analytical methods applied to a real-world exogenous shock: synthetic control, difference-in-differences, event study, Granger causality, volatility regression, and placebo testing across commodity, equity, and food markets.



---

## Key Findings

| Method | Finding |
|---|---|
| DiD (PanelOLS, entity FE, clustered SE) | +$41.77/bbl causal oil price premium through reopening |
| Synthetic control (Brent futures) | +$1.27/bbl Hormuz-specific war premium through reopening |
| Spot-futures basis spread | +$6.46/bbl through reopening |
| Commodity placebo (deseasonalized) | +15.0 index points oil vs non-Hormuz energy at reopening |
| Shipping route placebo | -7.94pp Hormuz vs non-Hormuz tanker CAR gap at t+30 |
| US vs EU defense event study | -18.28pp gap at t+30 (dual-benchmark, FX-adjusted) |
| OVX volatility regression | +30.2 points OVX premium above VIX prediction (p<0.0001) |
| Granger causality chain | Oil→fertilizer marginal at 10%; fertilizer→grain supported at 5% |
| Food cost burden (illustrative) | +$9.0B/year additional global food expenditure |
| Geo impact | 8 countries scored 7+/10, ~410M in high-exposure zones |

---

## Methods

### Event Study
Market model OLS regression fit on Nov 1 2025 to Feb 27 2026 estimation window. Dual-benchmark design: SPY for US-listed tickers, EXS1.DE (STOXX 600) for EU-listed tickers. FX-adjusted returns for GBP, EUR, and NOK-denominated stocks. Cumulative abnormal returns are calculated over the declared -5 to +30 trading-day event window; the global dataset cutoff remains June 18, 2026.

### Synthetic Control
Two comparable specifications are reported: all-spot FRED Brent against Dubai crude (20.2%) and FRED WTI (79.8%), and all-futures Brent against WTI using the demeaned spread. The final spot ATT is +$7.73/bbl, the futures ATT is +$1.27/bbl, and their difference is +$6.46/bbl through June 18. The all-spot pre-period RMSE is $4.17/bbl.

### Difference-in-Differences
Panel OLS with commodity entity fixed effects and clustered standard errors. Treatment unit: oil (Brent + WTI averaged). Control units: non-Hormuz energy (Henry Hub, coal ETF). Treatment date: Feb 28, 2026. Two-period decomposition: strike onset (Feb 28 to Mar 7) and Hormuz closure (Mar 7 onward).

### Placebo Tests
Three independent placebo designs:

1. Commodity: oil vs non-Hormuz energy (nat gas, coal)
2. Shipping: Hormuz-exposed (FRO, STNG) vs non-Hormuz control (HAFNI, INSW, NAT, TK)
3. Defense: US primes (LMT, RTX, NOC) vs EU primes (BAE, Rheinmetall, Leonardo)

### Volatility Regression
OVX regressed on VIX plus a post-event dummy (Feb 28 onward). HC3 robust standard errors. OVX/VIX ratio tracked pre vs post-event. Gold (GVZ) and Treasury (MOVE) volatility indices included as commodity and rates controls.

### Analysis Window

All pipelines, API calculations, charts, status counters, and generated intelligence are capped at June 18, 2026. Yahoo Finance downloads use June 19 internally because its `end` parameter is exclusive.

### Granger Causality
Transmission chain tested at lag 1 to 5 trading days:

- Oil returns to fertilizer stock returns (CF, MOS, NTR): marginal at 10% (minimum p=0.0949)
- Fertilizer returns to grain futures (ZW, ZC, ZS): supported at 5% (minimum p=0.0067)

The first link is no longer treated as conventionally significant after extending the sample through reopening.

---

## Honest Caveats

- Futures SC ATT (+$1.27/bbl through reopening) uses only WTI as donor (weight=1.0), making it a Brent-WTI spread change rather than a full synthetic counterfactual. Economically meaningful but narrower than the DiD estimate.
- Spot ATT remains sensitive to Dubai crude ending in Feb 2026 and being forward-filled afterward. The futures ATT and DiD remain the primary estimates.
- Nat gas deseasonalized using 2024 Nov-Apr baseline. The 2024 season was unusually bullish (+36.5%), raising the bar for the counterfactual. Gap widens after adjustment.
- Non-Hormuz shipping basket (INSW, TK) has partial Gulf exposure. Basket is directionally clean but not a perfect control.
- EU defense R-squared against EXS1.DE is 0.062 to 0.117, meaningfully better than SPY (approx 0.000) but still low. Abnormal return interpretation holds directionally.
- Single-event observational study. Convergent evidence from six methods supports causal interpretation, but correlated macro shocks (global risk-off, Trump tariff uncertainty) cannot be fully ruled out.
- Food cost burden ($9.0B/year) is illustrative. Physical planting-cycle transmission takes 6 to 12 months, and futures-price estimates should not be read as a complete physical-market pass-through.

---

## Project Structure

```
hormuzwatch/
|-- notebooks/
|   |-- 01_event_study.ipynb          # Equity CARs, dual-benchmark market model
|   |-- 02_synthetic_control.ipynb    # Spot + futures synthetic control, donor weights
|   |-- 03_commodity_placebo.ipynb    # Oil vs non-Hormuz energy, deseasonalized
|   |-- 04_volatility.ipynb           # OVX/VIX regression, regime shift
|   |-- 05_diff_in_diff.ipynb         # PanelOLS DiD, two-period decomposition
|   |-- 06_food_fertilizer.ipynb      # Granger causality, $9.0B illustrative food burden
|   `-- 07_geo_impact.ipynb           # 30-country impact scoring, choropleth maps
|
|-- pipelines/                        # Data ingestion (yfinance, FRED, IMF)
|   |-- commodities.py
|   |-- energy.py
|   |-- equities.py
|   |-- macro.py
|   `-- volatility.py
|
|-- data/processed/                   # Clean CSVs consumed by notebooks and UI
|   |-- commodities.csv
|   |-- country_impact.csv            # 30-country dual-score model
|   |-- energy.csv
|   |-- equities.csv
|   |-- food_fertilizer.csv
|   |-- macro.csv
|   `-- volatility.csv
|
|-- api/
|   |-- main.py                       # FastAPI: /api/status (yfinance), /api/news (Claude)
|   `-- requirements.txt
|
|-- server/
|   `-- news_server.py                # Standalone news server (alternative deployment)
|
|-- hormuzwatch-ui/                   # React + Vite + Tailwind dashboard
|   |-- src/
|   |   |-- components/
|   |   |   |-- tabs/                 # Overview, Energy, Equities, Methodology, News, Geo
|   |   |   |-- GeoImpactTab.jsx      # react-simple-maps, war/economy weight slider
|   |   |   |-- Header.jsx            # Live ticker bar, conflict day counter
|   |   |   `-- MetricCard.jsx
|   |   |-- context/
|   |   |   `-- LiveDataContext.jsx   # 15-min TTL cache, graceful static fallback
|   |   `-- data/                     # Pre-computed JS exports from processed CSVs
|   `-- scripts/
|       `-- parse_csvs.py             # Regenerates src/data/ from data/processed/
|
|-- outputs/charts/                   # PNG exports from all notebooks
|-- requirements.txt                  # Python dependencies
`-- start.sh                          # Starts API + Vite dev server
```

---

## Stack

| Layer | Technology |
|---|---|
| Analysis | Python, pandas, statsmodels, linearmodels, scikit-learn |
| Data | yfinance, FRED API, IMF, UNHCR estimates |
| Backend | FastAPI, uvicorn, anthropic SDK |
| Frontend | React 18, Vite, Tailwind CSS, Recharts, react-simple-maps |
| News feed | Claude claude-haiku-4-5 + web_search tool, 15-min TTL cache |
| Deployment | Railway (API + static frontend) |

---

## Local Setup

**Requirements:** Python 3.12+, Node 18+, uv

```bash
git clone https://github.com/Aman12x/HormuzWatch.git
cd HormuzWatch

# Python environment
uv venv && uv pip install -r requirements.txt

# Environment variables
cp .env.example .env
# Add provider/data keys as needed. Set ADMIN_API_KEY before exposing
# the maintenance endpoints outside localhost.

# Run data pipelines (optional, processed CSVs already included)
python -m pipelines.equities
python -m pipelines.commodities

# Start API + frontend
bash start.sh
```

API runs on `http://localhost:8000`. Frontend on `http://localhost:5173`.

---

## Data Sources

| Source | Series |
|---|---|
| Yahoo Finance (yfinance) | BZ=F, CL=F, LMT, RTX, NOC, XOM, CVX, BP, FRO, STNG, SPY, EXS1.DE, CF, MOS, NTR, ZW=F, ZC=F, ZS=F |
| FRED (EIA) | DCOILBRENTEU, DCOILWTICO |
| FRED (EIA) | DHHNGSP (Henry Hub natural gas) |
| FRED (IMF) | POILDUBUSDM (Dubai crude, monthly) |
| UNHCR / IMF | Country-level refugee and trade exposure estimates |

---
