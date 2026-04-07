# HormuzWatch

**Causal inference pipeline quantifying the global economic and humanitarian impact of the 2026 US-Israel war on Iran.**

Six independent analytical methods applied to a real-world exogenous shock: synthetic control, difference-in-differences, event study, Granger causality, volatility regression, and placebo testing across commodity, equity, and food markets.



---

## Key Findings

| Method | Finding |
|---|---|
| DiD (PanelOLS, entity FE, clustered SE) | +$39.4/bbl causal oil price premium |
| Synthetic control (Brent futures) | +$3.51/bbl Hormuz-specific war premium |
| Spot-futures basis spread | +$32.48/bbl extreme backwardation signal |
| Commodity placebo (deseasonalized) | +49.9 index points oil vs non-Hormuz energy |
| Shipping route placebo | -6.0pp Hormuz vs non-Hormuz tanker CAR gap |
| US vs EU defense event study | -19.4pp gap (dual-benchmark, FX-adjusted) |
| OVX volatility regression | +45 points OVX premium above VIX (p<0.0001) |
| Granger causality chain | Oil to fertilizer to grain confirmed (p=0.0001) |
| Food cost burden (illustrative) | +$5.9B/year additional global food expenditure |
| Geo impact | 8 countries scored 7+/10, ~410M in high-exposure zones |

---

## Methods

### Event Study
Market model OLS regression fit on Nov 1 2025 to Feb 27 2026 estimation window. Dual-benchmark design: SPY for US-listed tickers, EXS1.DE (STOXX 600) for EU-listed tickers. FX-adjusted returns for GBP, EUR, and NOK-denominated stocks. Cumulative abnormal returns calculated over -5 to +30 trading day event window around Feb 28, 2026.

### Synthetic Control
Donor pool: FRED Brent (77.1% weight), WTI (22.9%), Henry Hub (0%). Pre-period RMSE: $0.78/bbl. Two separate synthetic controls run: all-spot (FRED Brent as treated) and all-futures (BZ=F as treated) to isolate the spot-futures basis divergence. Placebo test run on WTI as untreated unit.

### Difference-in-Differences
Panel OLS with commodity entity fixed effects and clustered standard errors. Treatment unit: oil (Brent + WTI averaged). Control units: non-Hormuz energy (Henry Hub, coal ETF). Treatment date: Feb 28, 2026. Two-period decomposition: strike onset (Feb 28 to Mar 7) and Hormuz closure (Mar 7 onward).

### Placebo Tests
Three independent placebo designs:

1. Commodity: oil vs non-Hormuz energy (nat gas, coal)
2. Shipping: Hormuz-exposed (FRO, STNG) vs non-Hormuz control (HAFNI, INSW, NAT, TK)
3. Defense: US primes (LMT, RTX, NOC) vs EU primes (BAE, Rheinmetall, Leonardo)

### Volatility Regression
OVX regressed on VIX plus a post-event dummy (Feb 28 onward). HC3 robust standard errors. OVX/VIX ratio tracked pre vs post-event. Gold (GVZ) and Treasury (MOVE) volatility indices included as commodity and rates controls.

### Granger Causality
Transmission chain tested at lag 1 to 5 trading days:

- Oil returns to fertilizer stock returns (CF, MOS, NTR): p=0.0001 at lag 3
- Fertilizer returns to grain futures (ZW, ZC, ZS): p=0.0001 at lag 1, F=17.19

Both links confirmed at all 5 lags.

---

## Honest Caveats

- Futures SC ATT (+$3.51/bbl) uses only WTI as donor (weight=1.0), making it a Brent-WTI spread change rather than a full synthetic counterfactual. Economically meaningful but narrower than the DiD estimate.
- Spot ATT is inflated due to monthly Dubai crude data frozen at Feb 2026 levels. The futures ATT and DiD are the primary causal estimates.
- Nat gas deseasonalized using 2024 Nov-Apr baseline. The 2024 season was unusually bullish (+36.5%), raising the bar for the counterfactual. Gap widens after adjustment.
- Non-Hormuz shipping basket (INSW, TK) has partial Gulf exposure. Basket is directionally clean but not a perfect control.
- EU defense R-squared against EXS1.DE is 0.062 to 0.117, meaningfully better than SPY (approx 0.000) but still low. Abnormal return interpretation holds directionally.
- Single-event observational study. Convergent evidence from six methods supports causal interpretation, but correlated macro shocks (global risk-off, Trump tariff uncertainty) cannot be fully ruled out.
- Food cost burden ($5.9B/year) is illustrative. Physical planting-cycle transmission takes 6 to 12 months and is not yet visible in grain prices at 35 days post-event.

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
|   |-- 06_food_fertilizer.ipynb      # Granger causality, $5.9B food burden
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
cp hormuzwatch-ui/.env.example hormuzwatch-ui/.env
# Add to .env: ANTHROPIC_API_KEY=sk-ant-...
#              FRED_API_KEY=...

# Run data pipelines (optional, processed CSVs already included)
python pipelines/equities.py
python pipelines/commodities.py

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

