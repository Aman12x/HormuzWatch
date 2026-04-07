import MetricCard    from '../MetricCard.jsx'
import EventTimeline from '../EventTimeline.jsx'
import { syntheticControl, CONFLICT_DAY, oilStats, shippingPlacebo } from '../../data/metrics.js'
import { useLiveData } from '../../context/LiveDataContext.jsx'

export default function OverviewTab() {
  const { live } = useLiveData() ?? {}
  const conflictDay = live?.conflict_day ?? CONFLICT_DAY
  const brentPrice  = live?.oil?.brent_price  ?? oilStats.brentPeak
  const brentPct    = live?.oil?.brent_pct_chg ?? 56.9

  return (
    <div className="space-y-5">

      {/* Top metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="FUTURES ATT — CAUSAL ESTIMATE"
          value={`+$${syntheticControl.futuresATT}`}
          unit="/bbl"
          accent="gold"
          description="Average treatment effect on Brent futures (BZ=F vs CL=F synthetic control, demeaned). Cleanest causal estimate of Hormuz-specific war premium in the paper market."
        />
        <MetricCard
          label="SPOT–FUTURES BASIS SPREAD"
          value={`$${syntheticControl.basisSpread}`}
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
          <div className="border border-hw-border p-4" style={{ background: '#16162a' }}>
            <div className="font-mono text-[10px] tracking-[0.2em] text-hw-muted mb-3">
              SITUATION BRIEF — DAY {conflictDay}
            </div>
            <div className="space-y-2 text-hw-sub text-sm leading-relaxed font-inter">
              <p>
                US and Israeli forces launched coordinated strikes on Iranian nuclear and military
                infrastructure on February 28, 2026, triggering Iran's closure of the Strait of
                Hormuz eight days later — removing ~21% of seaborne global oil supply from the market
                and driving Brent spot prices from <span className="text-hw-text font-semibold">$77.74</span> to
                a peak of <span className="text-hw-text font-semibold">$121.88/bbl</span> (+56.6% indexed) within 30 trading days.
              </p>
              <p>
                Synthetic control analysis isolates a <span className="text-hw-gold font-semibold">+$3.51/bbl</span> causal
                Hormuz-specific war premium in the Brent futures curve, while the physical
                (EIA spot) market priced in <span className="text-hw-gold font-semibold">+$35.99/bbl</span> — a
                <span className="text-hw-text font-semibold"> $32.48/bbl basis spread</span> indicating
                extreme backwardation driven by acute supply tightness, not long-term price expectation revision.
              </p>
              <p>
                Equity markets showed a clear sell-the-news pattern in defense stocks
                (sector CAR <span className="text-red-400 font-semibold">−10.3%</span>),
                modest energy major outperformance led by BP
                (<span className="text-hw-gold font-semibold">+3.9%</span>),
                and sharp route-specific selling in Hormuz-exposed tankers
                (<span className="text-red-400 font-semibold">−12.3%</span> vs
                <span style={{ color: '#94a3b8' }} className="font-semibold"> −6.3%</span> for non-Hormuz control),
                a <span className="text-hw-text font-semibold">−6.0pp placebo gap</span> confirming insurance and seizure-risk pricing,
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
                  { label: 'WTI (futures)',   val: '+56.6%', color: '#ef4444' },
                  { label: 'Brent (futures)', val: '+40.2%', color: '#a78bfa' },
                  { label: 'Brent (EIA spot)',val: '+56.9%', color: '#e8b84b' },
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
                  { label: 'Defense (LMT/RTX/NOC)',      val: '−10.3%', color: '#ef4444' },
                  { label: 'Energy (XOM/CVX/BP)',         val: '+3.9%',  color: '#10b981' },
                  { label: 'Hormuz ship (FRO/STNG)',      val: '−12.3%', color: '#ef4444' },
                  { label: 'Ctrl ship (HAFNI/INSW/…)',    val: '−6.3%',  color: '#94a3b8' },
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
