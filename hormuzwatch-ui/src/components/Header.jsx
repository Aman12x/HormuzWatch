import { useLiveData } from '../context/LiveDataContext.jsx'
import { CONFLICT_DAY, oilStats as staticOilStats, syntheticControl as staticSC } from '../data/metrics.js'

export default function Header() {
  const { live, loading } = useLiveData() ?? {}

  const sc        = live?.metrics?.syntheticControl ?? staticSC
  const oilStats  = live?.metrics?.oilStats         ?? staticOilStats

  const conflictDay  = live?.conflict_day  ?? CONFLICT_DAY
  const hormuzDay    = live?.hormuz_day    ?? 30
  const brentPrice   = live?.oil?.brent_price
  const brentPct     = live?.oil?.brent_pct_chg
  const ovx          = live?.volatility?.ovx
  const hormuzStatus = live?.hormuz_status ?? 'CLOSED'

  const brentEiaPct  = ((oilStats.brentPeak - oilStats.brentBase) / oilStats.brentBase * 100).toFixed(1)

  const today = new Date()
  const dateStr = today.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  }).toUpperCase()

  const tickerItems = [
    {
      label: 'BRENT',
      val:   brentPrice ? `$${brentPrice.toFixed(2)}` : `$${oilStats.brentPeak}`,
      dir:   'up',
      sub:   brentPct != null
               ? `${brentPct > 0 ? '+' : ''}${brentPct.toFixed(1)}% vs pre-war`
               : `+${brentEiaPct}% vs pre-war`,
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
      sub:   `strait closed day ${hormuzDay}`,
    },
  ]

  return (
    <header
      className="border-b border-hw-border bg-hw-card"
      style={{ borderBottomColor: '#e8b84b22' }}
    >
      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-4">

        {/* Wordmark */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-2 h-2 rounded-full bg-hw-gold animate-pulse" />
          <span
            className="font-mono font-bold tracking-[0.3em] text-hw-gold"
            style={{ fontSize: '1rem', letterSpacing: '0.3em' }}
          >
            HORMUZWATCH
          </span>
          <span className="text-hw-muted font-mono text-xs hidden sm:inline tracking-wider">
            GEOPOLITICAL IMPACT ANALYTICS
          </span>
        </div>

        {/* Center date */}
        <span className="text-hw-muted font-mono text-xs tracking-widest hidden md:block">
          {dateStr}
        </span>

        {/* Conflict day counter */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {loading && (
            <span className="text-hw-muted font-mono text-[10px] animate-pulse">LIVE</span>
          )}
          {!loading && live && (
            <span className="text-green-500 font-mono text-[10px]">● LIVE</span>
          )}
          {!loading && !live && (
            <span className="text-hw-muted font-mono text-[10px]">CACHED</span>
          )}
          <div
            className="font-mono font-bold text-hw-gold px-2 py-0.5 border"
            style={{ fontSize: '1.1rem', borderColor: '#e8b84b55', background: '#e8b84b11' }}
          >
            CONFLICT DAY {conflictDay}
          </div>
        </div>
      </div>

      {/* Live ticker bar */}
      <div
        className="px-4 md:px-6 py-1 flex items-center gap-6 overflow-x-auto"
        style={{ background: '#1e2338', borderTop: '1px solid #3a406033', borderBottom: '1px solid #3a4060' }}
      >
        {tickerItems.map(item => (
          <div key={item.label} className="flex items-center gap-2 flex-shrink-0 py-0.5">
            <span className="text-hw-muted font-mono text-[10px] tracking-wider">{item.label}</span>
            <span
              className="font-mono font-semibold text-xs"
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
          <span className="text-hw-muted font-mono text-[10px] ml-auto flex-shrink-0">
            UPDATED {new Date(live.fetched_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} UTC
          </span>
        )}
      </div>
    </header>
  )
}
