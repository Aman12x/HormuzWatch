// HormuzWatch — analysis results, frozen at the June 18 2026 reopening.
//
// STATUS FIELDS MATTER. Only `ovxPlacebo` survived the inference review; it is
// the single reported finding. Everything marked `status: 'exploratory'` failed
// identification or inference and is retained for transparency, NOT as a result.
// See README "Exploratory — not reported as findings" for the specific failure
// in each case. Do not promote an exploratory number into a headline.

export const CONFLICT_START = new Date('2026-02-28')
export const HORMUZ_CLOSURE = new Date('2026-03-07')
export const HORMUZ_REOPENED = new Date('2026-06-18T00:00:00Z')
export const TODAY           = HORMUZ_REOPENED

export const CONFLICT_DAY = Math.floor(
  (TODAY - CONFLICT_START) / (1000 * 60 * 60 * 24)
) + 1   // inclusive

// ── REPORTED FINDING — OVX in-time placebo (scripts/ovx_placebo.py) ───────
// Oil-implied volatility ran further above its VIX-implied level during the
// closure than in any comparable window since OVX began in 2007. Tested against
// the empirical distribution of 77-day windows rather than an assumed error
// process, because residual AR(1) is ~0.99 and asymptotic p-values are void.
export const ovxPlacebo = {
  status         : 'reported',
  premiumLog     : 0.694,   // mean log(OVX) residual vs VIX-implied, event window
  premiumPts     : 38.60,   // same statistic in raw vol points (levels spec)
  windowDays     : 77,      // trading days, Feb 28 → Jun 18
  nNullWindows   : 4655,    // overlapping historical 77-day windows
  exceedances    : 0,       // historical windows at least as extreme
  percentile     : 99.98,
  pOverlapping   : 0.0002,
  pNonOverlapping: 0.0161,  // conservative; 0 of 61 independent windows
  nearestRival   : 'June 2020 COVID demand collapse (+0.58 log pts)',
  fitR2          : 0.504,
  caveat         : 'Establishes magnitude and rarity, not mechanism. Does not '
                 + 'separate the chokepoint from the wider war, OPEC, or other '
                 + 'concurrent oil news.',
}

// ── EXPLORATORY — Synthetic control (notebook 02) ─────────────────────────
// FAILED: the primary spec put 77% donor weight on Brent itself and returned a
// NEGATIVE ATT whose placebo was 79% as large. The spec reported below has no
// placebo test, and 20.2% of its counterfactual is a Dubai series that is
// forward-filled flat from before treatment. Not a result.
export const syntheticControl = {
  status       : 'exploratory',
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

// ── EXPLORATORY — Route-exposure placebo ──────────────────────────────────
// The cleanest identification idea in the project: same war, same industry,
// differs only in route exposure. It still fails, for two reasons.
//  1. Inference — an exact permutation test over all C(6,2)=15 route splits
//     ranks the observed gap 2nd, p=0.133. With six tankers the SMALLEST
//     attainable p-value is 0.067, so this design cannot reach 5% at any
//     effect size.
//  2. Measurement — every market model is empty (R² 0.000–0.022, betas ≈ 0),
//     so these "abnormal" returns are raw returns.
// Numbers below are from scripts/refit_core.py, which handles the foreign
// trading calendars jointly. The previously published gap of -7.94 appeared in
// no notebook output and has been removed.
export const shippingPlacebo = {
  status      : 'exploratory',
  hormuzCAR   : -21.98,  // FRO + STNG mean CAR at t+30
  nonHormuzCAR: -13.91,  // HAFNI + INSW + NAT + TK mean CAR at t+30
  gap         :  -8.07,  // Hormuz − control, percentage points
  pPermutation:   0.133, // exact, one-sided, 15 route splits
  minAttainableP: 0.067,
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

// ── EXPLORATORY — DiD: Oil vs Non-Hormuz Energy (notebook 05) ────────────
// Treatment: Brent + WTI. Control: Henry Hub Nat Gas + Coal ETF.
// FAILED on inference and on the control group:
//  · 4 entities. Cluster-robust SEs need ~30–50 clusters; the HC3 "cross-check"
//    is worse, treating 628 autocorrelated daily prices as independent draws.
//    The effective sample size is 4, so t=4.63 carries no information.
//  · Outcome is a non-stationary price level regressed on a step dummy with no
//    serial-correlation correction — the Bertrand-Duflo-Mullainathan setup.
//  · Parallel-trends "test" is a failure to reject (p=0.47) on an underpowered
//    linear-trend interaction, read as confirmation.
//  · Treatment date is Feb 28 (the strikes), so this is a war premium, not a
//    chokepoint premium.
export const didResults = {
  status     : 'exploratory',
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
