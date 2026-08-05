import { CONFLICT_DAY, oilStats, ovxPlacebo } from '../data/metrics.js'

const HORMUZ_DAYS_CLOSED = 103

/**
 * Masthead. Deliberately quiet: this is a closed study, not a live desk, so
 * there is no scrolling ticker and no live-status indicator. The summary strip
 * carries the reported finding and the window it applies to — nothing that
 * failed review appears here.
 */
export default function Header() {
  const brentPeakPct = (
    ((oilStats.brentPeak - oilStats.brentBase) / oilStats.brentBase) * 100
  ).toFixed(1)

  const summary = [
    {
      k: 'Reported finding',
      v: `+${ovxPlacebo.premiumLog.toFixed(2)}`,
      sub: 'log-pt OVX premium',
      emphasis: true,
    },
    {
      k: 'Historical rank',
      v: `${ovxPlacebo.exceedances} / ${ovxPlacebo.nNullWindows.toLocaleString()}`,
      sub: 'windows more extreme',
      emphasis: true,
    },
    { k: 'Brent peak', v: `$${oilStats.brentPeak}`, sub: `+${brentPeakPct}% vs pre-war` },
    { k: 'Strait closed', v: `${HORMUZ_DAYS_CLOSED}`, sub: 'days, reopened Jun 18' },
  ]

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center gap-x-5 gap-y-3 px-5 py-4 md:px-8">
        <div className="flex items-baseline gap-3">
          <h1 className="text-h2 font-semibold tracking-tight text-ink">HormuzWatch</h1>
          <span className="hidden text-label text-ink-3 sm:inline">
            Causal analysis of the 2026 Strait of Hormuz closure
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2.5">
          <span className="rounded border border-line-strong px-2 py-1 font-mono text-micro uppercase text-ink-2">
            Archived
          </span>
          <span className="font-mono text-micro uppercase text-ink-3">
            Data through 18 Jun 2026 · {CONFLICT_DAY} days
          </span>
        </div>
      </div>

      {/* Summary strip */}
      <div className="border-t border-line bg-bg">
        <dl className="mx-auto grid max-w-screen-2xl grid-cols-2 divide-x divide-line md:grid-cols-4">
          {summary.map(s => (
            <div key={s.k} className="px-5 py-3 md:px-8">
              <dt className="eyebrow">{s.k}</dt>
              <dd className="mt-1 flex items-baseline gap-2">
                <span
                  className={`tnum font-mono text-h3 font-medium ${
                    s.emphasis ? 'text-reported' : 'text-ink'
                  }`}
                >
                  {s.v}
                </span>
                <span className="truncate text-label text-ink-3">{s.sub}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </header>
  )
}
