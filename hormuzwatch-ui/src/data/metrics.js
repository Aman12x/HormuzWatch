// HormuzWatch — hardcoded analysis results
// All numbers from notebooks/01_event_study.ipynb + 02_synthetic_control.ipynb

export const CONFLICT_START = new Date('2026-02-28')
export const HORMUZ_CLOSURE = new Date('2026-03-07')
export const TODAY          = new Date('2026-04-06')

export const CONFLICT_DAY = Math.floor(
  (TODAY - CONFLICT_START) / (1000 * 60 * 60 * 24)
) + 1   // inclusive

// ── Synthetic control (notebook 02) ────────────────────────────────────────
export const syntheticControl = {
  // All-spot SC: FRED Brent ~ Dubai + FRED WTI
  spotATT      : 35.99,   // $/bbl, full post-period
  // All-futures SC: BZ=F ~ CL=F (demeaned)
  futuresATT   : 3.51,    // $/bbl, full post-period
  // Basis spread
  basisSpread  : 32.48,   // $/bbl = spot ATT - futures ATT
  prePeriodRMSE: 0.78,    // $/bbl (original 3-donor SC)
  donorWeights : [
    { name: 'FRED Brent (DCOILBRENTEU)', weight: 77.1 },
    { name: 'WTI (yfinance CL=F)',       weight: 22.9 },
    { name: 'Henry Hub (DHHNGSP)',        weight: 0.0  },
  ],
}

// ATT by phase for bar chart
export const attByPhase = [
  { phase: 'Strike→Hormuz',  label: 'Feb 28\n– Mar 7',  spotATT: 16.77, futuresATT: 0.94  },
  { phase: 'Hormuz onward',  label: 'Mar 7\n– present', spotATT: 41.04, futuresATT: 4.18  },
  { phase: 'Full post',      label: 'Mar 1\n– present', spotATT: 35.99, futuresATT: 3.51  },
]

// ── Event study (notebook 01) ────────────────────────────────────────────
export const equityStats = {
  defense        : { car: -10.26, tickers: ['LMT', 'RTX', 'NOC'],              color: '#3b82f6' },
  energy         : { car:  +3.85, tickers: ['XOM', 'CVX', 'BP'],               color: '#e8b84b' },
  shipping_hormuz: { car: -12.33, tickers: ['FRO', 'STNG'],                    color: '#ef4444' },
  shipping_ctrl  : { car:  -6.32, tickers: ['HAFNI', 'INSW', 'NAT', 'TK'],    color: '#94a3b8' },
}

// Route-exposure placebo: Hormuz-exposed vs non-Hormuz control basket
export const shippingPlacebo = {
  hormuzCAR   : -12.33,  // FRO + STNG basket average, normalized at t=−1
  nonHormuzCAR:  -6.32,  // HAFNI + INSW + NAT + TK basket average, normalized at t=−1
  gap         :  -6.01,  // Hormuz − ctrl, percentage points
}

export const tickerCAR = {
  LMT  : -14.22,
  RTX  :  -5.70,
  NOC  : -10.86,
  BP   : +16.44,
  CVX  :  -0.20,
  XOM  :  -4.68,
  FRO  : -13.41,
  STNG : -11.25,
  HAFNI:  -1.05,
  INSW :  -9.45,
  NAT  :  -4.85,
  TK   :  -9.94,
}

// ── Oil prices ────────────────────────────────────────────────────────────
export const oilStats = {
  brentBase      : 77.74,   // $/bbl on Feb 28
  wtiBase        : 71.23,   // $/bbl on Feb 28
  brentPeak      : 121.88,  // FRED Brent peak
  wtiPeak        : 111.54,  // yfinance WTI peak
  brentIndexedEnd: 140.2,   // BZ=F at t+30
  wtiIndexedEnd  : 156.6,   // CL=F at t+30
}

// ── DiD: Oil vs Non-Hormuz Energy (notebook 05) ──────────────────────────
// Treatment: Brent + WTI. Control: Henry Hub Nat Gas + Coal ETF (COAL).
// Panel: 4 commodities × 104 trading days = 416 obs. Entity FEs via PanelOLS.
export const didResults = {
  fullPost   : { coef: 64.86, se: 15.08, t: 4.30, p: 0.0000, dolBbl: 39.40 },
  p1Strike   : { coef: 42.04, se: 13.12, t: 3.21, p: 0.0015, dolBbl: 25.54 },  // Mar 2–6
  p2Hormuz   : { coef: 70.86, se: 15.60, t: 4.54, p: 0.0000, dolBbl: 43.05 },  // Mar 9+
  // Hormuz closure increment = p2 − p1 ≈ +$17.51/bbl
  hormuzIncrement: 17.51,
  brentBase  : 60.75,   // $/bbl on Jan 2, 2026 (index base)
}

// ── Timeline events ────────────────────────────────────────────────────────
export const timelineEvents = [
  {
    date       : '28 FEB 2026',
    label      : 'US-Israel Strikes Begin',
    description: 'Coordinated airstrikes on Iranian nuclear and military infrastructure. Brent opens +4%.',
    type       : 'critical',
  },
  {
    date       : '07 MAR 2026',
    label      : 'Strait of Hormuz Closure',
    description: 'Iran announces closure of Hormuz to commercial shipping. ~21% of global oil trade disrupted.',
    type       : 'critical',
  },
  {
    date       : '03 APR 2026',
    label      : 'Infrastructure Expansion',
    description: 'US forces expand targeting to Iranian energy infrastructure. Brent spot hits $121.88.',
    type       : 'escalation',
  },
  {
    date       : '06 APR 2026',
    label      : 'Present (Day 37)',
    description: 'Conflict ongoing. Diplomatic back-channels active. Futures curve in deep backwardation.',
    type       : 'current',
  },
]
