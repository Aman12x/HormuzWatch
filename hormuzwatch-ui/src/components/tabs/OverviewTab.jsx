import MetricCard    from '../MetricCard.jsx'
import EventTimeline from '../EventTimeline.jsx'
import {
  CONFLICT_DAY,
  oilStats as staticOilStats,
  shippingPlacebo as staticShippingPlacebo,
  equityStats as staticEquityStats,
  ovxPlacebo,
} from '../../data/metrics.js'

const fmt = (n, decimals = 1) => {
  const v = parseFloat(n)
  const s = v.toFixed(decimals)
  return v >= 0 ? `+${s}` : s
}

export default function OverviewTab() {

  const shippingPlacebo = staticShippingPlacebo
  const oilStats       = staticOilStats
  const equityStats    = staticEquityStats

  const conflictDay = CONFLICT_DAY
  const brentPrice  = oilStats.brentPeak
  const wtiPctChg   = (oilStats.wtiIndexedEnd - 100)
  const brentPctChg = (oilStats.brentIndexedEnd - 100)
  const brentPeakPct = ((oilStats.brentPeak - oilStats.brentBase) / oilStats.brentBase * 100).toFixed(1)

  return (
    <div className="space-y-5">

      {/* Scope banner — this page led with refuted numbers before the review */}
      <div className="border border-hw-border bg-hw-card/70 p-4">
        <div className="font-mono text-[10px] tracking-[0.2em] text-hw-gold mb-2">
          ONE REPORTED FINDING · NINE EXPLORATORY
        </div>
        <p className="text-hw-sub text-sm leading-relaxed font-inter">
          Ten analyses were run on this event. After an inference review, one survived and is
          reported below. The synthetic control, difference-in-differences, basis spread, Granger
          chain, food-cost and geographic-score analyses failed identification or inference and are
          retained only as exploratory work — their numbers appear in the other tabs marked as such,
          not as results. The synthetic control failed its own placebo test and returned a{' '}
          <span className="text-hw-text font-semibold">negative</span> estimate. See{' '}
          <span className="text-hw-text">METHOD</span> and the repository README for the specific
          failure in each case.
        </p>
      </div>

      {/* Top metric cards — the reported finding + descriptive context only */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="OVX PREMIUM — REPORTED"
          value={`+${ovxPlacebo.premiumLog.toFixed(2)}`}
          unit="log pts"
          accent="gold"
          description="Mean deviation of oil-implied volatility above its VIX-implied level over the 77-day closure window. Tested against every comparable window since 2007, not an assumed error process."
        />
        <MetricCard
          label="VS 2007–2026 RECORD"
          value={`${ovxPlacebo.exceedances} / ${ovxPlacebo.nNullWindows.toLocaleString()}`}
          accent="gold"
          description={`Historical 77-day windows at least as extreme. Conservative non-overlapping p = ${ovxPlacebo.pNonOverlapping} — the floor this test can resolve. Nearest rival: ${ovxPlacebo.nearestRival}.`}
        />
        <MetricCard
          label="BRENT PEAK — DESCRIPTIVE"
          value={`$${oilStats.brentPeak}`}
          unit="/bbl"
          accent="blue"
          description={`Futures peak during the window, +${brentPeakPct}% from the Feb 28 baseline of $${oilStats.brentBase}. A descriptive fact, not a causal estimate — no counterfactual is claimed.`}
        />
        <MetricCard
          label="ANALYSIS WINDOW"
          value={conflictDay}
          unit="days"
          accent="blue"
          description="Inclusive days from the Feb 28 strikes through the formal reopening on Jun 18, 2026. All estimates are capped at reopening."
        />
      </div>

      {/* Main grid: timeline + brief */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2">
          <EventTimeline />
        </div>

        <div className="lg:col-span-3 space-y-3">

          {/* Situation brief */}
          <div className="border border-hw-border p-4" style={{ background: '#232840' }}>
            <div className="font-mono text-[10px] tracking-[0.2em] text-hw-muted mb-3">
              FINAL SITUATION BRIEF — THROUGH JUN 18, 2026
            </div>
            <div className="space-y-2 text-hw-sub text-sm leading-relaxed font-inter">
              <p>
                US and Israeli forces launched coordinated strikes on Iranian nuclear and military
                infrastructure on February 28, 2026, triggering Iran's closure of the Strait of
                Hormuz eight days later — disrupting a route carrying ~21% of seaborne global oil trade
                and driving Brent futures from{' '}
                <span className="text-hw-text font-semibold">${oilStats.brentBase}</span> to
                a peak of{' '}
                <span className="text-hw-text font-semibold">${oilStats.brentPeak}/bbl</span>
                {' '}(+{brentPeakPct}% from baseline).
              </p>
              <p>
                Oil-implied volatility ran{' '}
                <span className="text-hw-gold font-semibold">
                  +{ovxPlacebo.premiumLog.toFixed(2)} log points
                </span>{' '}
                above the level implied by equity volatility across the window — further than in
                any of the {ovxPlacebo.nNullWindows.toLocaleString()} comparable 77-day stretches
                since OVX began in 2007 ({ovxPlacebo.exceedances} were more extreme; conservative{' '}
                <span className="text-hw-text font-semibold">p&nbsp;=&nbsp;{ovxPlacebo.pNonOverlapping}</span>).
                The nearest historical rival is the {ovxPlacebo.nearestRival}. This establishes that
                the episode was an extreme oil-volatility dislocation; it does{' '}
                <span className="text-hw-text font-semibold">not</span> separate the chokepoint from
                the wider war.
              </p>
              <p>
                Equity markets showed a sell-the-news pattern in defense stocks
                (sector CAR{' '}
                <span className="text-red-400 font-semibold">{fmt(equityStats.defense.car)}%</span>),
                modest energy major outperformance led by BP
                (<span className="text-hw-gold font-semibold">{fmt(equityStats.energy.car)}%</span>),
                and heavier selling in Hormuz-exposed tankers
                (<span className="text-red-400 font-semibold">{fmt(equityStats.shipping_hormuz.car)}%</span> vs{' '}
                <span style={{ color: '#94a3b8' }} className="font-semibold">{fmt(shippingPlacebo.nonHormuzCAR)}%</span> for
                non-Hormuz control). These are{' '}
                <span className="text-hw-text font-semibold">descriptive</span>: the underlying
                market models have almost no explanatory power (R² 0.000–0.022), and an exact
                permutation test over all 15 possible route splits ranks the observed{' '}
                {shippingPlacebo.gap.toFixed(1)}pp gap second, p&nbsp;=&nbsp;{shippingPlacebo.pPermutation}.
                With six tankers the smallest attainable p-value is {shippingPlacebo.minAttainableP},
                so the design cannot establish a route effect at any effect size.
              </p>
            </div>
          </div>

          {/* Quick stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-hw-card border border-hw-border p-3">
              <div className="font-mono text-[10px] text-hw-muted mb-2 tracking-wider">OIL MOVE FROM BASELINE</div>
              <div className="space-y-1.5">
                {[
                  { label: 'WTI (futures)',    val: `${fmt(wtiPctChg)}%`,   color: '#ef4444' },
                  { label: 'Brent (futures)',   val: `${fmt(brentPctChg)}%`, color: '#a78bfa' },
                  { label: 'Brent futures peak', val: `+${brentPeakPct}%`,    color: '#e8b84b' },
                ].map(r => (
                  <div key={r.label} className="flex justify-between items-center">
                    <span className="text-hw-muted font-mono text-xs">{r.label}</span>
                    <span className="font-mono font-semibold text-xs" style={{ color: r.color }}>
                      {r.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-hw-card border border-hw-border p-3">
              <div className="font-mono text-[10px] text-hw-muted mb-2 tracking-wider">EQUITY SECTOR CAR</div>
              <div className="space-y-1.5">
                {[
                  { label: 'Defense (LMT/RTX/NOC)',   val: `${fmt(equityStats.defense.car)}%`,          color: '#ef4444' },
                  { label: 'Energy (XOM/CVX/BP)',      val: `${fmt(equityStats.energy.car)}%`,           color: '#10b981' },
                  { label: 'Hormuz ship (FRO/STNG)',   val: `${fmt(equityStats.shipping_hormuz.car)}%`,  color: '#ef4444' },
                  { label: 'Ctrl ship (HAFNI/INSW/…)', val: `${fmt(equityStats.shipping_ctrl.car)}%`,    color: '#94a3b8' },
                ].map(r => (
                  <div key={r.label} className="flex justify-between items-center">
                    <span className="text-hw-muted font-mono text-xs">{r.label}</span>
                    <span className="font-mono font-semibold text-xs" style={{ color: r.color }}>
                      {r.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
