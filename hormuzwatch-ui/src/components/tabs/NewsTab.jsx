import { useMemo, useState } from 'react'
import { Archive, ExternalLink, ShieldCheck } from 'lucide-react'
import { NEWS_ITEMS, NEWS_BRIEF } from '../../data/newsArchive.js'

// Severity is an ordered scale — one hue stepped by intensity, not three hues.
const SEVERITY = {
  HIGH:   { color: '#10151a', label: 'High' },
  MEDIUM: { color: '#4a545e', label: 'Medium' },
  LOW:    { color: '#626c76', label: 'Low' },
}

// Category is genuinely categorical: fixed-order assignment from the validated
// set, and MARKETS previously duplicated DIPLOMATIC's hue.
const CATEGORY = {
  DIPLOMATIC: { background: '#1d68c318', color: '#1d68c3' },
  ENERGY:     { background: '#d9531f18', color: '#d9531f' },
  MARKETS:    { background: '#12805a18', color: '#12805a' },
  MILITARY:   { background: '#6b3fa018', color: '#6b3fa0' },
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
        <span className="flex items-center gap-2 font-mono text-micro font-bold" style={{ color: severity.color }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: severity.color }} />
          {severity.label}
        </span>
        <span className="rounded-sm px-2 py-1 font-mono text-micro" style={category}>
          {item.category}
        </span>
      </div>
      <h3 className="mt-4 text-lead font-semibold leading-snug text-ink group-hover:text-white">
        {item.title}
        {url && <ExternalLink size={12} className="ml-2 inline opacity-50" aria-hidden="true" />}
      </h3>
      <p className="mt-2 text-xs leading-5 text-ink-2">{item.summary}</p>
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-3 font-mono text-micro text-ink-3">
        <span>{item.source}</span>
        <time dateTime={item.timestamp}>{formatDate(item.timestamp)}</time>
      </div>
    </>
  )

  const classes = 'group block min-h-56 border border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:border-reported/40 hover:bg-surface'
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
      <section className="overflow-hidden border border-line bg-surface">
        <div className="grid gap-6 p-5 md:grid-cols-[1fr_auto] md:p-7">
          <div>
            <div className="flex items-center gap-2 font-mono text-micro text-reported">
              <Archive size={14} aria-hidden="true" /> FINAL · SOURCE-LINKED ARCHIVE
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white">The reopening, in context</h1>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-ink-2">
              {NEWS_BRIEF}
            </p>
          </div>
          <div className="flex h-fit items-center gap-3 border border-emerald-500/25 bg-emerald-500/5 px-4 py-3">
            <ShieldCheck size={18} className="text-emerald-400" aria-hidden="true" />
            <div>
              <div className="font-mono text-micro text-emerald-400">ARCHIVE VERIFIED</div>
              <div className="mt-1 font-mono text-micro text-ink-3">DATA THROUGH JUN 18, 2026</div>
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
              className={`border px-3 py-1.5 font-mono text-micro transition ${filter === category ? 'border-reported/40 bg-reported/10 text-reported' : 'border-line text-ink-3 hover:border-line-strong hover:text-ink'}`}
            >
              {category}
            </button>
          ))}
        </div>
        <span className="font-mono text-micro text-ink-3">{visible.length} SOURCES</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visible.map(item => <NewsCard key={`${item.source}-${item.title}`} item={item} />)}
      </div>
    </div>
  )
}
