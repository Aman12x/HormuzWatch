import EventTimeline from '../EventTimeline.jsx'
import { Badge, Callout, DataList, Panel, Stat } from '../ui.jsx'
import {
  CONFLICT_DAY,
  oilStats,
  shippingPlacebo,
  equityStats,
  ovxPlacebo,
} from '../../data/metrics.js'

const pct = (n, d = 1) => `${n >= 0 ? '+' : ''}${parseFloat(n).toFixed(d)}%`

// The full verdict list, so the front page states the score plainly rather than
// leaving a reader to infer it from which tabs carry warnings.
const LEDGER = [
  { name: 'OVX volatility, in-time placebo', status: 'reported', verdict: 'Reported' },
  { name: 'Synthetic control (spot & futures)', status: 'refuted', verdict: 'Failed placebo' },
  { name: 'Spot–futures basis spread', status: 'exploratory', verdict: 'Derived, not independent' },
  { name: 'Difference-in-differences', status: 'exploratory', verdict: '4 effective clusters' },
  { name: 'Commodity placebo', status: 'exploratory', verdict: 'Base-dated after shock' },
  { name: 'Shipping route placebo', status: 'exploratory', verdict: 'p = 0.133' },
  { name: 'US vs EU defense event study', status: 'exploratory', verdict: 'R² ≈ 0, not reproducible' },
  { name: 'Granger transmission chain', status: 'exploratory', verdict: 'Uncorrected min-p' },
  { name: 'Food cost burden', status: 'exploratory', verdict: 'Flat counterfactual' },
  { name: 'Geographic impact scores', status: 'exploratory', verdict: 'Hand-assigned index' },
]

export default function OverviewTab() {
  const brentPeakPct = (
    ((oilStats.brentPeak - oilStats.brentBase) / oilStats.brentBase) * 100
  ).toFixed(1)

  return (
    <div className="space-y-6">

      {/* ── The claim, stated once, plainly ──────────────────────────────── */}
      <section className="card p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <Badge status="reported" />
          <span className="text-label text-ink-3">1 of 10 analyses survived review</span>
        </div>

        <h2 className="mt-4 max-w-prose text-h1 font-semibold text-ink">
          Oil volatility ran further above its equity-implied level than in any
          comparable window since 2007.
        </h2>

        <p className="mt-4 max-w-prose text-lead text-ink-2">
          Across the 77 trading days the Strait was closed, OVX averaged{' '}
          <span className="tnum font-medium text-ink">
            +{ovxPlacebo.premiumLog.toFixed(3)} log points
          </span>{' '}
          above the level implied by VIX. Tested against every comparable window in
          the {ovxPlacebo.nNullWindows.toLocaleString()}-window historical record,{' '}
          <span className="font-medium text-ink">{ovxPlacebo.exceedances}</span> were
          more extreme.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat
            label="Observed premium"
            value={`+${ovxPlacebo.premiumLog.toFixed(3)}`}
            unit="log pts"
            emphasis
            note="Mean residual from log(OVX) ~ log(VIX) over the closure window."
          />
          <Stat
            label="Historical rank"
            value={`${ovxPlacebo.exceedances} / ${ovxPlacebo.nNullWindows.toLocaleString()}`}
            emphasis
            note={`Windows at least as extreme since OVX began. Nearest rival: ${ovxPlacebo.nearestRival}.`}
          />
          <Stat
            label="Conservative p"
            value={ovxPlacebo.pNonOverlapping}
            note="Non-overlapping windows only. This is the floor the design can resolve — zero exceedances of 61."
          />
          <Stat
            label="Analysis window"
            value={CONFLICT_DAY}
            unit="days"
            note="28 Feb strikes through the 18 Jun reopening. Every estimate is capped there."
          />
        </div>

        <Callout tone="reported" title="What this does not show">
          {ovxPlacebo.caveat}
        </Callout>
      </section>

      {/* ── Scope ─────────────────────────────────────────────────────────── */}
      <Panel title="Scope of this archive">
        <div className="grid grid-cols-1 gap-x-10 gap-y-6 lg:grid-cols-2">
          <p className="max-w-prose text-body text-ink-2">
            Ten analyses were run on this event. After an inference review, one survived
            and is stated above. The rest failed identification or inference. Their
            numbers remain in the other tabs, marked as exploratory, because falsifying
            your own work is part of the record — but none of them is a result. The
            synthetic control is the sharpest case: it failed its own placebo test and
            returned a negative estimate, and that result was not carried into the
            original write-up.
          </p>

          <ul className="divide-y divide-line">
            {LEDGER.map(row => (
              <li key={row.name} className="flex items-baseline gap-4 py-2 first:pt-0 last:pb-0">
                <span
                  className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${
                    row.status === 'reported' ? 'bg-reported' : row.status === 'refuted' ? 'bg-refuted' : 'bg-line-strong'
                  }`}
                  aria-hidden="true"
                />
                <span className="flex-1 text-label text-ink">{row.name}</span>
                <span
                  className={`text-label ${
                    row.status === 'reported'
                      ? 'text-reported'
                      : row.status === 'refuted'
                        ? 'text-refuted'
                        : 'text-ink-3'
                  }`}
                >
                  {row.verdict}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Panel>

      {/* ── Context ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Panel title="Chronology" className="h-full">
            <EventTimeline />
          </Panel>
        </div>

        <div className="space-y-6 lg:col-span-3">
          <Panel title="Descriptive summary">
            <div className="max-w-prose space-y-4 text-body text-ink-2">
              <p>
                US and Israeli forces struck Iranian nuclear and military infrastructure
                on 28 February 2026. Iran closed the Strait of Hormuz eight days later,
                disrupting a route carrying roughly 21% of seaborne global oil trade and
                driving Brent futures from{' '}
                <span className="tnum text-ink">${oilStats.brentBase}</span> to a peak of{' '}
                <span className="tnum text-ink">${oilStats.brentPeak}</span> per barrel
                (+{brentPeakPct}%).
              </p>
              <p>
                Equity markets sold defense stocks (sector CAR{' '}
                <span className="tnum text-ink">{pct(equityStats.defense.car)}</span>),
                with modest energy-major outperformance led by BP (
                <span className="tnum text-ink">{pct(equityStats.energy.car)}</span>) and
                heavier selling in Hormuz-exposed tankers (
                <span className="tnum text-ink">{pct(equityStats.shipping_hormuz.car)}</span>{' '}
                versus{' '}
                <span className="tnum text-ink">{pct(shippingPlacebo.nonHormuzCAR)}</span>{' '}
                for non-Hormuz control).
              </p>
              <p className="text-ink-3">
                These are descriptive. The underlying market models carry almost no
                explanatory power (R² 0.000–0.022), and an exact permutation test over
                all 15 possible route splits ranks the{' '}
                {shippingPlacebo.gap.toFixed(1)}pp gap second, p = {shippingPlacebo.pPermutation}.
                With six tankers the smallest attainable p-value is{' '}
                {shippingPlacebo.minAttainableP}, so no effect size could have produced a
                significant result.
              </p>
            </div>
          </Panel>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Panel title="Oil, from baseline">
              <DataList
                rows={[
                  { k: 'Brent futures', v: pct(oilStats.brentIndexedEnd - 100) },
                  { k: 'WTI futures', v: pct(oilStats.wtiIndexedEnd - 100) },
                  { k: 'Brent peak', v: `+${brentPeakPct}%` },
                ]}
              />
            </Panel>
            <Panel title="Equity sector CAR">
              <DataList
                rows={[
                  { k: 'Defense', v: pct(equityStats.defense.car) },
                  { k: 'Energy majors', v: pct(equityStats.energy.car) },
                  { k: 'Tankers — Hormuz', v: pct(equityStats.shipping_hormuz.car) },
                  { k: 'Tankers — control', v: pct(equityStats.shipping_ctrl.car) },
                ]}
              />
            </Panel>
          </div>
        </div>
      </div>
    </div>
  )
}
