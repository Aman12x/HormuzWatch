/**
 * LiveDataContext — fetches the final, cutoff-bounded dataset on app mount.
 *
 * Three endpoints are fetched in parallel:
 *   /api/status      — final prices (Brent, WTI, OVX, VIX, equities)
 *   /api/data/timeseries — oil price & equity CAR time series + volatility
 *   /api/metrics     — computed econometric metrics (ATTs, CARs, DiD)
 *
 * All three are merged into a single `live` object.
 * Static data in metrics.js / oilPrices.js / equities.js acts as fallback
 * while loading or if the API is unreachable.
 */
import { createContext, useContext, useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

const LiveDataContext = createContext(null)
let finalDataPromise

async function _fetchJson(url) {
  const r = await fetch(url, { cache: 'force-cache' })
  if (!r.ok) throw new Error(`API ${r.status} — ${url}`)
  return r.json()
}

function loadFinalData() {
  if (!finalDataPromise) {
    finalDataPromise = Promise.allSettled([
      _fetchJson(`${API_BASE}/api/status`),
      _fetchJson(`${API_BASE}/api/data/timeseries`),
      _fetchJson(`${API_BASE}/api/metrics`),
    ])
  }
  return finalDataPromise
}

export function LiveDataProvider({ children }) {
  const [live, setLive]       = useState(null)
  const [error, setError]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    loadFinalData().then(([statusRes, tsRes, metricsRes]) => {
      if (cancelled) return

      const merged = {}

      if (statusRes.status === 'fulfilled')  Object.assign(merged, statusRes.value)
      else console.warn('[LiveData] /api/status failed:', statusRes.reason)

      if (tsRes.status === 'fulfilled')      merged.timeseries = tsRes.value
      else console.warn('[LiveData] /api/data/timeseries failed:', tsRes.reason)

      if (metricsRes.status === 'fulfilled') merged.metrics = metricsRes.value
      else console.warn('[LiveData] /api/metrics failed:', metricsRes.reason)

      setLive(Object.keys(merged).length ? merged : null)
      setError(Object.keys(merged).length ? null : new Error('All API requests failed'))
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [])

  return (
    <LiveDataContext.Provider value={{ live, loading, error }}>
      {children}
    </LiveDataContext.Provider>
  )
}

export function useLiveData() {
  return useContext(LiveDataContext)
}
