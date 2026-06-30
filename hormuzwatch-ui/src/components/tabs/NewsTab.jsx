import { useEffect, useMemo, useState } from 'react'
import { Archive, ExternalLink, ShieldCheck } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

const SEVERITY = {
  HIGH:   { color: '#f97316', label: 'HIGH' },
  MEDIUM: { color: '#e8b84b', label: 'MEDIUM' },
  LOW:    { color: '#60a5fa', label: 'LOW' },
}

const CATEGORY = {
  MILITARY:   { background: '#ef444416', color: '#f87171' },
  ENERGY:     { background: '#e8b84b16', color: '#e8b84b' },
  DIPLOMATIC: { background: '#3b82f616', color: '#60a5fa' },
  MARKETS:    { background: '#a78bfa16', color: '#a78bfa' },
}

function formatDate(iso) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(iso)).toUpperCase()
}

function safeUrl(value) {
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null
  } catch {
    return null
  }
}

async function getJson(path) {
  const response = await fetch(`${API_BASE}${path}`, { cache: 'no-store' })
  if (!response.ok) throw new Error(`Archive request failed (${response.status})`)
  return response.json()
}

function NewsCard({ item }) {
  const severity = SEVERITY[item.severity] ?? SEVERITY.MEDIUM
  const category = CATEGORY[item.category] ?? CATEGORY.MARKETS
  const url = safeUrl(item.url)

  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 font-mono text-[10px] font-bold tracking-[0.16em]" style={{ color: severity.color }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: severity.color }} />
          {severity.label}
        </span>
        <span className="rounded-sm px-2 py-1 font-mono text-[9px] tracking-[0.14em]" style={category}>
          {item.category}
        </span>
      </div>
      <h3 className="mt-4 text-[15px] font-semibold leading-snug text-hw-text group-hover:text-white">
        {item.title}
        {url && <ExternalLink size={12} className="ml-2 inline opacity-50" aria-hidden="true" />}
      </h3>
      <p className="mt-2 text-xs leading-5 text-hw-sub">{item.summary}</p>
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-hw-border/70 pt-3 font-mono text-[10px] tracking-wide text-hw-muted">
        <span>{item.source}</span>
        <time dateTime={item.timestamp}>{formatDate(item.timestamp)}</time>
      </div>
    </>
  )

  const classes = 'group block min-h-56 border border-hw-border bg-hw-card/80 p-5 transition hover:-translate-y-0.5 hover:border-hw-gold/40 hover:bg-hw-card'
  return url ? (
    <a className={classes} href={url} target="_blank" rel="noreferrer">{content}</a>
  ) : (
    <article className={classes}>{content}</article>
  )
}

function Skeleton() {
  return <div className="min-h-56 animate-pulse border border-hw-border bg-hw-card p-5"><div className="h-3 w-24 bg-hw-border" /><div className="mt-7 h-4 w-4/5 bg-hw-border" /><div className="mt-3 h-3 w-full bg-hw-border" /><div className="mt-2 h-3 w-3/4 bg-hw-border" /></div>
}

export default function NewsTab() {
  const [state, setState] = useState({ items: [], summary: null, loading: true, error: null })
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    let active = true
    Promise.all([getJson('/api/news'), getJson('/api/news/summary')])
      .then(([items, summary]) => {
        if (active) setState({ items, summary, loading: false, error: null })
      })
      .catch(error => {
        if (active) setState({ items: [], summary: null, loading: false, error: error.message })
      })
    return () => { active = false }
  }, [])

  const categories = useMemo(
    () => ['ALL', ...new Set(state.items.map(item => item.category))],
    [state.items],
  )
  const visible = filter === 'ALL' ? state.items : state.items.filter(item => item.category === filter)

  return (
    <div className="space-y-5">
      <section className="overflow-hidden border border-hw-border bg-hw-card">
        <div className="grid gap-6 p-5 md:grid-cols-[1fr_auto] md:p-7">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] text-hw-gold">
              <Archive size={14} aria-hidden="true" /> FINAL · SOURCE-LINKED ARCHIVE
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white">The reopening, in context</h1>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-hw-sub">
              {state.summary?.brief ?? 'Reporting is frozen at the formal June 18, 2026 reopening date so the evidence stays aligned with the analysis window.'}
            </p>
          </div>
          <div className="flex h-fit items-center gap-3 border border-emerald-500/25 bg-emerald-500/5 px-4 py-3">
            <ShieldCheck size={18} className="text-emerald-400" aria-hidden="true" />
            <div>
              <div className="font-mono text-[10px] tracking-[0.16em] text-emerald-400">ARCHIVE VERIFIED</div>
              <div className="mt-1 font-mono text-[10px] text-hw-muted">DATA THROUGH JUN 18, 2026</div>
            </div>
          </div>
        </div>
      </section>

      {state.error && (
        <div role="alert" className="border border-red-900/70 bg-red-950/20 p-5 text-sm text-red-300">
          The source archive could not be loaded. {state.error}
        </div>
      )}

      {state.loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} />)}</div>
      ) : state.items.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter archive by category">
              {categories.map(category => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setFilter(category)}
                  aria-pressed={filter === category}
                  className={`border px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] transition ${filter === category ? 'border-hw-gold/60 bg-hw-gold/10 text-hw-gold' : 'border-hw-border text-hw-muted hover:border-hw-muted hover:text-hw-text'}`}
                >
                  {category}
                </button>
              ))}
            </div>
            <span className="font-mono text-[10px] tracking-widest text-hw-muted">{visible.length} SOURCES</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visible.map(item => <NewsCard key={`${item.source}-${item.title}`} item={item} />)}
          </div>
        </>
      )}
    </div>
  )
}
