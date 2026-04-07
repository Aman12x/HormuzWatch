import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, ExternalLink, AlertTriangle, Radio } from 'lucide-react'

// ── Config ────────────────────────────────────────────────────────────────────
const API_BASE      = import.meta.env.VITE_API_URL ?? ''
const AUTO_REFRESH  = 5 * 60 * 1000   // 5 minutes

// ── Severity ──────────────────────────────────────────────────────────────────
const SEVERITY = {
  CRITICAL: { color: '#ef4444', label: 'CRITICAL' },
  HIGH:     { color: '#f97316', label: 'HIGH'     },
  MEDIUM:   { color: '#e8b84b', label: 'MEDIUM'   },
  LOW:      { color: '#3b82f6', label: 'LOW'       },
}

// ── Category ──────────────────────────────────────────────────────────────────
const CATEGORY = {
  MILITARY:    { bg: '#ef444418', color: '#ef4444' },
  ENERGY:      { bg: '#e8b84b18', color: '#e8b84b' },
  DIPLOMATIC:  { bg: '#3b82f618', color: '#3b82f6' },
  HUMANITARIAN:{ bg: '#10b98118', color: '#10b981' },
  MARKETS:     { bg: '#a78bfa18', color: '#a78bfa' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtTime(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
    })
  } catch {
    return iso
  }
}

function fmtDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    }).toUpperCase()
  } catch {
    return iso
  }
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      className="border border-hw-border p-4 animate-pulse"
      style={{ background: '#12121a', borderLeft: '3px solid #1e1e2e' }}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="h-2.5 bg-hw-border rounded w-16" />
        <div className="h-4 bg-hw-border rounded w-20" />
      </div>
      <div className="space-y-2 mb-3">
        <div className="h-3.5 bg-hw-border rounded w-full" />
        <div className="h-3.5 bg-hw-border rounded w-5/6" />
      </div>
      <div className="space-y-1.5">
        <div className="h-2.5 bg-hw-border rounded w-full" />
        <div className="h-2.5 bg-hw-border rounded w-4/5" />
      </div>
      <div className="flex gap-3 mt-3">
        <div className="h-2 bg-hw-border rounded w-24" />
        <div className="h-2 bg-hw-border rounded w-20" />
      </div>
    </div>
  )
}

// ── News card ─────────────────────────────────────────────────────────────────
function NewsCard({ item }) {
  const sev = SEVERITY[item.severity] ?? SEVERITY.MEDIUM
  const cat = CATEGORY[item.category] ?? CATEGORY.MARKETS

  const handleClick = () => {
    if (item.url) window.open(item.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      className="border border-hw-border p-4 transition-all duration-150"
      style={{
        background:  '#12121a',
        borderLeft:  `3px solid ${sev.color}`,
        cursor:      item.url ? 'pointer' : 'default',
      }}
      onClick={handleClick}
      onMouseEnter={e => { if (item.url) e.currentTarget.style.filter = 'brightness(1.15)' }}
      onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)' }}
    >
      {/* Top row: severity dot + category badge */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: sev.color, boxShadow: `0 0 4px ${sev.color}` }}
          />
          <span
            className="font-mono text-[9px] tracking-widest font-bold"
            style={{ color: sev.color }}
          >
            {sev.label}
          </span>
        </div>
        <span
          className="font-mono text-[9px] tracking-wider px-1.5 py-0.5 rounded-sm"
          style={{ background: cat.bg, color: cat.color }}
        >
          {item.category}
        </span>
      </div>

      {/* Title */}
      <div
        className="font-inter font-medium leading-snug mb-2"
        style={{ fontSize: '13px', color: '#e2e8f0' }}
      >
        {item.title}
        {item.url && (
          <ExternalLink
            size={10}
            className="inline ml-1.5 opacity-40"
            style={{ verticalAlign: 'middle' }}
          />
        )}
      </div>

      {/* Summary */}
      <p
        className="font-inter leading-relaxed mb-3"
        style={{ fontSize: '11px', color: '#94a3b8' }}
      >
        {item.summary}
      </p>

      {/* Footer: source + time */}
      <div className="flex items-center justify-between">
        <span
          className="font-mono tracking-wide uppercase"
          style={{ fontSize: '10px', color: '#64748b' }}
        >
          {item.source}
        </span>
        <span
          className="font-mono"
          style={{ fontSize: '10px', color: '#475569' }}
        >
          {fmtTime(item.timestamp)}
        </span>
      </div>
    </div>
  )
}

// ── Executive brief ───────────────────────────────────────────────────────────
function ExecutiveBrief({ brief, updatedAt, loading }) {
  if (loading) {
    return (
      <div className="bg-hw-card border border-hw-border p-4 animate-pulse">
        <div className="h-2.5 bg-hw-border rounded w-40 mb-3" />
        <div className="space-y-2">
          <div className="h-3 bg-hw-border rounded w-full" />
          <div className="h-3 bg-hw-border rounded w-11/12" />
          <div className="h-3 bg-hw-border rounded w-4/5" />
        </div>
      </div>
    )
  }

  if (!brief) return null

  return (
    <div className="bg-hw-card border border-hw-border p-4" style={{ borderLeftColor: '#e8b84b', borderLeftWidth: 3 }}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] tracking-[0.2em] text-hw-muted">
          EXECUTIVE INTELLIGENCE BRIEF
        </span>
        {updatedAt && (
          <span className="font-mono text-[10px] text-hw-muted">
            {fmtDate(updatedAt)} · {fmtTime(updatedAt)}
          </span>
        )}
      </div>
      <p className="font-inter text-sm leading-relaxed" style={{ color: '#cbd5e1' }}>
        {brief}
      </p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function NewsTab() {
  const [news,       setNews]       = useState([])
  const [brief,      setBrief]      = useState(null)
  const [briefAt,    setBriefAt]    = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [briefLoad,  setBriefLoad]  = useState(false)
  const [error,      setError]      = useState(null)
  const [lastFetch,  setLastFetch]  = useState(null)

  const fetchNews = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/news`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail ?? `HTTP ${res.status}`)
      }
      const data = await res.json()
      setNews(Array.isArray(data) ? data : [])
      setLastFetch(new Date())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchBrief = useCallback(async () => {
    setBriefLoad(true)
    try {
      const res = await fetch(`${API_BASE}/api/news/summary`)
      if (!res.ok) return
      const data = await res.json()
      setBrief(data.brief ?? null)
      setBriefAt(data.updated_at ?? null)
    } catch {
      // brief is optional — fail silently
    } finally {
      setBriefLoad(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchNews()
    fetchBrief()
  }, [fetchNews, fetchBrief])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const id = setInterval(() => {
      fetchNews()
      fetchBrief()
    }, AUTO_REFRESH)
    return () => clearInterval(id)
  }, [fetchNews, fetchBrief])

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }).toUpperCase()

  return (
    <div className="space-y-4">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="font-mono font-bold tracking-[0.3em] text-hw-gold" style={{ fontSize: '1rem' }}>
            INTELLIGENCE FEED
          </span>
          <span className="font-mono text-[10px] text-hw-muted hidden sm:inline tracking-wider">
            {dateStr}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {lastFetch && (
            <span className="font-mono text-[10px] text-hw-muted hidden md:inline">
              UPDATED {fmtTime(lastFetch.toISOString())}
            </span>
          )}
          <button
            onClick={() => { fetchNews(); fetchBrief() }}
            disabled={loading}
            className="flex items-center gap-1.5 border border-hw-border px-3 py-1.5 font-mono text-[10px] tracking-wider text-hw-muted hover:text-hw-text hover:border-hw-gold transition-colors duration-150 disabled:opacity-40"
          >
            <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
            REFRESH FEED
          </button>
        </div>
      </div>

      {/* ── Executive brief ─────────────────────────────────────────────────── */}
      <ExecutiveBrief brief={brief} updatedAt={briefAt} loading={briefLoad && !brief} />

      {/* ── Loading state ────────────────────────────────────────────────────── */}
      {loading && news.length === 0 && (
        <>
          <div className="flex items-center gap-2 py-2">
            <Radio size={12} className="animate-pulse" style={{ color: '#e8b84b' }} />
            <span className="font-mono text-[11px] tracking-[0.2em] text-hw-muted animate-pulse">
              ESTABLISHING SECURE CONNECTION...
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </>
      )}

      {/* ── Error state ──────────────────────────────────────────────────────── */}
      {error && news.length === 0 && (
        <div className="bg-hw-card border border-red-900 p-6 flex flex-col items-center gap-4">
          <AlertTriangle size={32} style={{ color: '#ef4444' }} />
          <div className="text-center">
            <div className="font-mono font-bold tracking-[0.3em] text-red-400 mb-2">
              FEED UNAVAILABLE
            </div>
            <p className="font-mono text-[11px] text-hw-muted max-w-sm leading-relaxed">
              {error}
            </p>
            {error.includes('ANTHROPIC_API_KEY') && (
              <p className="font-mono text-[10px] text-hw-muted mt-2 opacity-60">
                Add ANTHROPIC_API_KEY to hormuzwatch/.env and restart the API server.
              </p>
            )}
          </div>
          <button
            onClick={() => { fetchNews(); fetchBrief() }}
            className="border border-red-800 px-4 py-1.5 font-mono text-[10px] tracking-wider text-red-400 hover:bg-red-900/20 transition-colors"
          >
            RETRY CONNECTION
          </button>
        </div>
      )}

      {/* ── Partial-error banner (has stale data but refresh failed) ─────────── */}
      {error && news.length > 0 && (
        <div className="border border-red-900/50 bg-red-950/20 px-4 py-2 flex items-center gap-2">
          <AlertTriangle size={12} style={{ color: '#ef4444' }} />
          <span className="font-mono text-[10px] text-red-400">
            Refresh failed: {error} — showing cached data
          </span>
        </div>
      )}

      {/* ── News grid ────────────────────────────────────────────────────────── */}
      {news.length > 0 && (
        <>
          {/* Filter summary row */}
          <div className="flex items-center gap-4 text-[10px] font-mono text-hw-muted">
            <span>{news.length} ITEMS</span>
            {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(s => {
              const count = news.filter(n => n.severity === s).length
              if (!count) return null
              return (
                <span key={s} style={{ color: SEVERITY[s].color }}>
                  {count} {s}
                </span>
              )
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {news.map((item, i) => (
              <NewsCard key={`${item.title}-${i}`} item={item} />
            ))}
          </div>

          <p className="font-mono text-[10px] text-hw-muted text-center pt-1">
            AUTO-REFRESH EVERY 5 MIN · POWERED BY CLAUDE + WEB SEARCH · HORMUZWATCH INTEL MODULE
          </p>
        </>
      )}
    </div>
  )
}
