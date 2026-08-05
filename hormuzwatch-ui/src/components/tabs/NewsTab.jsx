import { useMemo, useState } from 'react'
import { Archive, ExternalLink, ShieldCheck } from 'lucide-react'
import { NEWS_ITEMS, NEWS_BRIEF } from '../../data/newsArchive.js'

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

export default function NewsTab() {
  const [filter, setFilter] = useState('ALL')

  const categories = useMemo(
    () => ['ALL', ...new Set(NEWS_ITEMS.map(item => item.category))],
    [],
  )
  const visible = filter === 'ALL' ? NEWS_ITEMS : NEWS_ITEMS.filter(item => item.category === filter)

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
              {NEWS_BRIEF}
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
    </div>
  )
}
