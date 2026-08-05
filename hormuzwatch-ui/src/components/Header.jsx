import { CONFLICT_DAY, oilStats, ovxPlacebo } from '../data/metrics.js'

const HORMUZ_DAYS_CLOSED = 103

export default function Header() {
  const brentPeakPct = ((oilStats.brentPeak - oilStats.brentBase) / oilStats.brentBase * 100).toFixed(1)

  const dateStr = new Date('2026-06-18T12:00:00Z').toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  }).toUpperCase()

  // The ticker carries the one reported finding plus descriptive facts.
  // It deliberately does NOT show the synthetic-control or basis-spread
  // numbers — those are exploratory and failed review.
  const tickerItems = [
    {
      label: 'BRENT PEAK',
      val:   `$${oilStats.brentPeak}`,
      dir:   'up',
      sub:   `+${brentPeakPct}% vs pre-war`,
    },
    {
      label: 'OVX PREMIUM',
      val:   `+${ovxPlacebo.premiumLog.toFixed(2)}`,
      dir:   'up',
      sub:   'log pts vs VIX-implied',
    },
    {
      label: 'VS 2007–2026',
      val:   `${ovxPlacebo.exceedances} / ${ovxPlacebo.nNullWindows.toLocaleString()}`,
      dir:   'up',
      sub:   'windows more extreme',
    },
    {
      label: 'HORMUZ',
      val:   'REOPENED',
      dir:   'ok',
      sub:   `Jun 18 · ${HORMUZ_DAYS_CLOSED} days closed`,
    },
  ]

  return (
    <header
      className="border-b border-hw-border bg-hw-card"
      style={{ borderBottomColor: '#e8b84b22' }}
    >
      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 min-h-16 py-3 flex items-center justify-between gap-4">

        {/* Wordmark */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-2 h-2 rounded-full bg-hw-gold shadow-[0_0_10px_rgba(232,184,75,0.55)]" />
          <span
            className="font-mono font-bold tracking-[0.3em] text-hw-gold"
            style={{ fontSize: '1rem', letterSpacing: '0.3em' }}
          >
            HORMUZWATCH
          </span>
          <span className="text-hw-muted font-mono text-[10px] hidden lg:inline tracking-[0.14em]">
            GEOPOLITICAL IMPACT ANALYTICS
          </span>
        </div>

        {/* Center date */}
        <span className="text-hw-muted font-mono text-[10px] tracking-widest hidden xl:block">
          {dateStr}
        </span>

        {/* Conflict day counter */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-hw-muted font-mono text-[10px] hidden sm:inline">● ARCHIVED</span>
          <div
            className="font-mono font-bold text-hw-gold px-2.5 py-1 border whitespace-nowrap"
            style={{ fontSize: '0.75rem', borderColor: '#e8b84b55', background: '#e8b84b11' }}
          >
            <span className="hidden sm:inline">FINAL · </span>DAY {CONFLICT_DAY}
          </div>
        </div>
      </div>

      {/* Live ticker bar */}
      <div
        className="px-4 md:px-6 flex items-stretch overflow-x-auto"
        style={{ background: '#1e2338', borderTop: '1px solid #3a406033', borderBottom: '1px solid #3a4060' }}
      >
        {tickerItems.map(item => (
          <div key={item.label} className="flex items-center gap-2 flex-shrink-0 border-r border-hw-border/70 px-4 py-2.5 first:pl-0">
            <span className="text-hw-muted font-mono text-[10px] tracking-wider">{item.label}</span>
            <span
              className="font-mono font-semibold text-[11px]"
              style={{ color: item.dir === 'warn' ? '#ef4444' : item.dir === 'ok' ? '#10b981' : '#e8b84b' }}
            >
              {item.val}
            </span>
            {item.sub && (
              <span className="text-hw-muted font-mono text-[10px]">{item.sub}</span>
            )}
          </div>
        ))}
        <span className="text-hw-muted font-mono text-[10px] ml-auto flex-shrink-0 self-center pl-4">
          DATA THROUGH 2026-06-18
        </span>
      </div>
    </header>
  )
}
