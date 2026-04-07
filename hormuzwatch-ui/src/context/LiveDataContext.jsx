/**
 * LiveDataContext — fetches /api/status once on app mount.
 * Components read live values from useLiveData(); static metrics.js
 * values act as the fallback while loading or if the API is unreachable.
 */
import { createContext, useContext, useEffect, useState } from 'react'

// In dev the Vite proxy rewrites /api → http://localhost:8000/api.
// In production set VITE_API_URL=https://your-api-host (no trailing slash).
const API_BASE = import.meta.env.VITE_API_URL ?? ''

const LiveDataContext = createContext(null)

export function LiveDataProvider({ children }) {
  const [live, setLive]       = useState(null)   // null = not yet loaded
  const [error, setError]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch(`${API_BASE}/api/status`)
      .then(r => {
        if (!r.ok) throw new Error(`API ${r.status}`)
        return r.json()
      })
      .then(data => { if (!cancelled) { setLive(data); setLoading(false) } })
      .catch(err => { if (!cancelled) { setError(err.message); setLoading(false) } })
    return () => { cancelled = true }
  }, [])

  return (
    <LiveDataContext.Provider value={{ live, loading, error }}>
      {children}
    </LiveDataContext.Provider>
  )
}

/** Returns the live API payload, or null while loading / on error. */
export function useLiveData() {
  return useContext(LiveDataContext)
}
