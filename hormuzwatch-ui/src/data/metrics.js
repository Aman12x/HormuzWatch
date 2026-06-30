// HormuzWatch — hardcoded analysis results
// All numbers from notebooks/01_event_study.ipynb + 02_synthetic_control.ipynb

export const CONFLICT_START = new Date('2026-02-28')
export const HORMUZ_CLOSURE = new Date('2026-03-07')
export const HORMUZ_REOPENED = new Date('2026-06-18T00:00:00Z')
export const TODAY           = HORMUZ_REOPENED

export const CONFLICT_DAY = Math.floor(
  (TODAY - CONFLICT_START) / (1000 * 60 * 60 * 24)
) + 1   // inclusive

// ── Synthetic control (notebook 02) ────────────────────────────────────────
export const syntheticControl = {
  // All-spot SC: FRED Brent ~ Dubai + FRED WTI
  spotATT      : 7.73,    // $/bbl, full post-period through Jun 18
  // All-futures SC: BZ=F ~ CL=F (demeaned)
  futuresATT   : 1.27,    // $/bbl, full post-period through Jun 18
  // Basis spread
  basisSpread  : 6.46,    // $/bbl = spot ATT - futures ATT
  prePeriodRMSE: 4.17,
  donorWeights : [
    { name: 'Dubai crude (POILDUBUSDM)', weight: 20.2 },
    { name: 'FRED WTI (DCOILWTICO)',     weight: 79.8 },
  ],
}

// ATT by phase for bar chart
export const attByPhase = [
  { phase: 'Strike→Hormuz',  label: 'Feb 28\n– Mar 7',  spotATT: -2.41, futuresATT: 0.94  },
  { phase: 'Hormuz closure', label: 'Mar 7\n– Jun 18',  spotATT:  8.44, futuresATT: 1.29  },
  { phase: 'Full post',      label: 'Mar 1\n– Jun 18',  spotATT:  7.73, futuresATT: 1.27  },
]

// ── Event study (notebook 01) ────────────────────────────────────────────
export const equityStats = {
  defense        : { car: -14.01, tickers: ['LMT', 'RTX', 'NOC'],              color: '#3b82f6' },
  energy         : { car:  -4.05, tickers: ['XOM', 'CVX', 'BP'],               color: '#e8b84b' },
  shipping_hormuz: { car: -21.98, tickers: ['FRO', 'STNG'],                    color: '#ef4444' },
  shipping_ctrl  : { car: -14.04, tickers: ['HAFNI', 'INSW', 'NAT', 'TK'],    color: '#94a3b8' },
}

// Route-exposure placebo: Hormuz-exposed vs non-Hormuz control basket
export const shippingPlacebo = {
  hormuzCAR   : -21.98,  // FRO + STNG basket average, normalized at t=−1
  nonHormuzCAR: -14.04,  // HAFNI + INSW + NAT + TK basket average, normalized at t=−1
  gap         :  -7.94,  // Hormuz − ctrl, percentage points
}

export const tickerCAR = {
  LMT  : -21.72,
  RTX  :  -7.83,
  NOC  : -17.48,
  BP   : +12.38,
  CVX  :  -8.58,
  XOM  : -13.33,
  FRO  : -19.51,
  STNG : -10.28,
  HAFNI:  -1.01,
  INSW :  -9.58,
  NAT  :  -4.93,
  TK   : -13.48,
}

// ── Oil prices ────────────────────────────────────────────────────────────
export const oilStats = {
  brentBase      : 77.74,   // $/bbl on Feb 28
  wtiBase        : 71.23,   // $/bbl on Feb 28
  brentPeak      : 118.35,
  wtiPeak        : 112.95,
  brentIndexedEnd: 102.7,   // BZ=F at Jun 18
  wtiIndexedEnd  : 107.5,   // CL=F at Jun 18
}

// ── DiD: Oil vs Non-Hormuz Energy (notebook 05) ──────────────────────────
// Treatment: Brent + WTI. Control: Henry Hub Nat Gas + Coal ETF (COAL).
// Panel: 4 commodities × 104 trading days = 416 obs. Entity FEs via PanelOLS.
export const didResults = {
  fullPost   : { coef: 68.76, se: 14.84, t: 4.63, p: 0.0000, dolBbl: 41.77 },
  p1Strike   : { coef: 42.04, se: 13.14, t: 3.20, p: 0.0015, dolBbl: 25.54 },  // Mar 2–6
  p2Hormuz   : { coef: 70.61, se: 14.96, t: 4.72, p: 0.0000, dolBbl: 42.90 },  // Mar 9–Jun 18
  hormuzIncrement: 28.57,
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
    date       : '07 APR 2026',
    label      : 'Brent Spot Peak',
    description: 'FRED/EIA Brent reaches the analysis-window peak of $138.21 per barrel.',
    type       : 'escalation',
  },
  {
    date       : '18 JUN 2026',
    label      : 'Strait Reopens — Analysis Window Ends',
    description: 'The US-Iran memorandum formally reopens Hormuz. All reported estimates stop on this date.',
    type       : 'final',
  },
]
