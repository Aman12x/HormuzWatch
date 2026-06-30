import { useLiveData } from '../context/LiveDataContext.jsx'
import { CONFLICT_DAY, oilStats as staticOilStats, syntheticControl as staticSC } from '../data/metrics.js'

export default function Header() {
  const { live, loading } = useLiveData() ?? {}

  const sc        = live?.metrics?.syntheticControl ?? staticSC
  const oilStats  = live?.metrics?.oilStats         ?? staticOilStats

  const conflictDay  = live?.conflict_day  ?? CONFLICT_DAY
  const hormuzDay    = live?.hormuz_day    ?? 103
  const brentPrice   = live?.oil?.brent_price
  const brentPct     = live?.oil?.brent_pct_chg
  const ovx          = live?.volatility?.ovx
  const hormuzStatus = live?.hormuz_status ?? 'OPEN'

  const brentFallbackPct = ((oilStats.brentPeak - oilStats.brentBase) / oilStats.brentBase * 100).toFixed(1)

  const analysisDate = new Date(`${live?.as_of ?? '2026-06-18'}T12:00:00Z`)
  const dateStr = analysisDate.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  }).toUpperCase()

  const tickerItems = [
    {
      label: 'BRENT',
      val:   brentPrice ? `$${brentPrice.toFixed(2)}` : `$${oilStats.brentPeak}`,
      dir:   'up',
      sub:   brentPct != null
               ? `${brentPct > 0 ? '+' : ''}${brentPct.toFixed(1)}% vs pre-war`
               : `+${brentFallbackPct}% vs pre-war`,
    },
    {
      label: 'FUTURES ATT',
      val:   `+$${sc.futuresATT}`,
      dir:   'up',
      sub:   'causal estimate',
    },
    {
      label: 'BASIS SPREAD',
      val:   `$${sc.basisSpread}`,
      dir:   'up',
      sub:   'physical premium',
    },
    {
      label: 'OVX',
      val:   ovx ? ovx.toFixed(1) : '—',
      dir:   'up',
      sub:   'oil vol index',
    },
    {
      label: 'HORMUZ',
      val:   hormuzStatus,
      dir:   hormuzStatus === 'CLOSED' ? 'warn' : 'ok',
      sub:   `reopened Jun 18 · ${hormuzDay} days closed`,
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
          {loading && (
            <span className="text-hw-muted font-mono text-[10px] animate-pulse hidden sm:inline">LOADING</span>
          )}
          {!loading && live && (
            <span className={live.market_data_status === 'FALLBACK' ? 'text-yellow-500 font-mono text-[10px] hidden sm:inline' : 'text-green-500 font-mono text-[10px] hidden sm:inline'}>
              ● {live.market_data_status === 'FALLBACK' ? 'BUNDLED DATA' : 'FINAL DATA'}
            </span>
          )}
          {!loading && !live && (
            <span className="text-hw-muted font-mono text-[10px] hidden sm:inline">BUNDLED</span>
          )}
          <div
            className="font-mono font-bold text-hw-gold px-2.5 py-1 border whitespace-nowrap"
            style={{ fontSize: '0.75rem', borderColor: '#e8b84b55', background: '#e8b84b11' }}
          >
            <span className="hidden sm:inline">FINAL · </span>DAY {conflictDay}
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
        {live?.fetched_at && (
          <span className="text-hw-muted font-mono text-[10px] ml-auto flex-shrink-0 self-center pl-4">
            DATA THROUGH {live.as_of}
          </span>
        )}
      </div>
    </header>
  )
}
