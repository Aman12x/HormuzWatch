import MetricCard    from '../MetricCard.jsx'
import EventTimeline from '../EventTimeline.jsx'
import {
  syntheticControl as staticSC,
  CONFLICT_DAY,
  oilStats as staticOilStats,
  shippingPlacebo as staticShippingPlacebo,
  equityStats as staticEquityStats,
} from '../../data/metrics.js'
import { useLiveData } from '../../context/LiveDataContext.jsx'

const fmt = (n, decimals = 1) => {
  const v = parseFloat(n)
  const s = v.toFixed(decimals)
  return v >= 0 ? `+${s}` : s
}

export default function OverviewTab() {
  const { live } = useLiveData() ?? {}

  const sc             = live?.metrics?.syntheticControl ?? staticSC
  const shippingPlacebo = live?.metrics?.shippingPlacebo ?? staticShippingPlacebo
  const oilStats       = live?.metrics?.oilStats         ?? staticOilStats
  const equityStats    = live?.metrics?.equityStats      ?? staticEquityStats

  const conflictDay = live?.conflict_day ?? CONFLICT_DAY
  const brentPrice  = live?.oil?.brent_price  ?? oilStats.brentPeak
  const wtiPctChg   = live?.oil?.wti_pct_chg   ?? (oilStats.wtiIndexedEnd - 100)
  const brentPctChg = live?.oil?.brent_pct_chg ?? (oilStats.brentIndexedEnd - 100)
  const brentEiaPct = ((oilStats.brentPeak - oilStats.brentBase) / oilStats.brentBase * 100).toFixed(1)

  return (
    <div className="space-y-5">

      {/* Top metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="FUTURES ATT — CAUSAL ESTIMATE"
          value={`+$${sc.futuresATT}`}
          unit="/bbl"
          accent="gold"
          description="Average treatment effect on Brent futures (BZ=F vs CL=F synthetic control, demeaned). Cleanest causal estimate of Hormuz-specific war premium in the paper market."
        />
        <MetricCard
          label="SPOT–FUTURES BASIS SPREAD"
          value={`$${sc.basisSpread}`}
          unit="/bbl"
          accent="red"
          description="Physical market premium above futures counterfactual. Reflects extreme backwardation — refineries paying immediate spot premiums futures curve hasn't yet absorbed."
        />
        <MetricCard
          label="SHIPPING PLACEBO GAP"
          value={`${shippingPlacebo.gap.toFixed(1)}pp`}
          accent="red"
          description={`Hormuz-exposed tankers (${shippingPlacebo.hormuzCAR.toFixed(1)}%) vs non-Hormuz control (${shippingPlacebo.nonHormuzCAR.toFixed(1)}%). Route-specific underperformance — rules out sector-wide confounder.`}
        />
        <MetricCard
          label="CONFLICT DAY"
          value={conflictDay}
          unit="days"
          accent="blue"
          description="Days since US-Israel strikes began Feb 28, 2026. Hormuz closed since Mar 7 (Day 8). ~21% of global seaborne oil trade remains disrupted."
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
              SITUATION BRIEF — DAY {conflictDay}
            </div>
            <div className="space-y-2 text-hw-sub text-sm leading-relaxed font-inter">
              <p>
                US and Israeli forces launched coordinated strikes on Iranian nuclear and military
                infrastructure on February 28, 2026, triggering Iran's closure of the Strait of
                Hormuz eight days later — removing ~21% of seaborne global oil supply from the market
                and driving Brent spot prices from{' '}
                <span className="text-hw-text font-semibold">${oilStats.brentBase}</span> to
                a peak of{' '}
                <span className="text-hw-text font-semibold">${oilStats.brentPeak}/bbl</span>
                {' '}(+{brentEiaPct}% from baseline).
              </p>
              <p>
                Synthetic control analysis isolates a{' '}
                <span className="text-hw-gold font-semibold">+${sc.futuresATT}/bbl</span> causal
                Hormuz-specific war premium in the Brent futures curve, while the physical
                (EIA spot) market priced in{' '}
                <span className="text-hw-gold font-semibold">+${sc.spotATT}/bbl</span> — a{' '}
                <span className="text-hw-text font-semibold">${sc.basisSpread}/bbl basis spread</span> indicating
                extreme backwardation driven by acute supply tightness, not long-term price expectation revision.
              </p>
              <p>
                Equity markets showed a clear sell-the-news pattern in defense stocks
                (sector CAR{' '}
                <span className="text-red-400 font-semibold">{fmt(equityStats.defense.car)}%</span>),
                modest energy major outperformance led by BP
                (<span className="text-hw-gold font-semibold">{fmt(equityStats.energy.car)}%</span>),
                and sharp route-specific selling in Hormuz-exposed tankers
                (<span className="text-red-400 font-semibold">{fmt(equityStats.shipping_hormuz.car)}%</span> vs{' '}
                <span style={{ color: '#94a3b8' }} className="font-semibold">{fmt(shippingPlacebo.nonHormuzCAR)}%</span> for non-Hormuz control),
                a{' '}
                <span className="text-hw-text font-semibold">{shippingPlacebo.gap.toFixed(1)}pp placebo gap</span> confirming insurance and seizure-risk pricing,
                not sector-wide pessimism.
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
                  { label: 'Brent (EIA peak)',  val: `+${brentEiaPct}%`,     color: '#e8b84b' },
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
