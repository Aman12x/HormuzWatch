import { useState, useCallback, useMemo } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps'
import {
  BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer,
} from 'recharts'
import { countryData, dataByNumeric } from '../data/geoImpact.js'
import MetricCard from './MetricCard.jsx'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// ── Color scale ──────────────────────────────────────────────────────────────
function scoreToColor(score) {
  if (score == null || score === 0) return '#12121f'
  const t = Math.min(10, Math.max(0, score)) / 10
  if (t < 0.5) {
    const s = t / 0.5
    const r = Math.round(26  + (232 - 26)  * s)
    const g = Math.round(26  + (184 - 26)  * s)
    const b = Math.round(46  + (75  - 46)  * s)
    return `rgb(${r},${g},${b})`
  }
  const s = (t - 0.5) / 0.5
  const r = Math.round(232 + (239 - 232) * s)
  const g = Math.round(184 * (1 - s))
  const b = Math.round(75  * (1 - s))
  return `rgb(${r},${g},${b})`
}

// ── Composite score computation ───────────────────────────────────────────────
function compositeScore(d, warAlpha) {
  const w = warAlpha / 100
  return parseFloat((w * d.war_score + (1 - w) * d.economy_score).toFixed(2))
}

// ── War proximity badge ───────────────────────────────────────────────────────
const PROXIMITY_COLORS = {
  direct:     '#ef4444',
  proximate:  '#f97316',
  regional:   '#e8b84b',
  remote:     '#585b70',
}
const PROXIMITY_LABELS = {
  direct:    'DIRECT',
  proximate: 'PROXIMATE',
  regional:  'REGIONAL',
  remote:    'REMOTE',
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
const MapTooltip = ({ data, x, y, warAlpha }) => {
  if (!data) return null
  const score = compositeScore(data, warAlpha)
  const scoreColor = scoreToColor(score)
  return (
    <div
      style={{
        position: 'fixed',
        left: x + 14,
        top: y - 10,
        pointerEvents: 'none',
        zIndex: 9999,
        background: '#2a2f4a',
        border: '1px solid #3a4060',
        borderLeft: `3px solid ${scoreColor}`,
        padding: '8px 12px',
        fontFamily: 'monospace',
        fontSize: 11,
        maxWidth: 260,
        boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
      }}
    >
      <div style={{ color: '#cdd6f4', fontWeight: 'bold', marginBottom: 4, fontSize: 12 }}>
        {data.country}
        {data.war_proximity && (
          <span style={{
            marginLeft: 8, fontSize: 9,
            color: PROXIMITY_COLORS[data.war_proximity],
            border: `1px solid ${PROXIMITY_COLORS[data.war_proximity]}`,
            padding: '1px 4px',
          }}>
            {PROXIMITY_LABELS[data.war_proximity]}
          </span>
        )}
      </div>
      <div style={{ color: scoreColor, fontSize: 16, fontWeight: 'bold', marginBottom: 6 }}>
        {score.toFixed(1)} / 10
      </div>
      <div style={{ color: '#a6adc8', lineHeight: 1.8, fontSize: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span>Economy score</span>
          <span style={{ color: '#89b4fa' }}>{data.economy_score.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span>War score</span>
          <span style={{ color: '#ef4444' }}>{data.war_score.toFixed(2)}</span>
        </div>
        <div style={{ borderTop: '1px solid #3a4060', marginTop: 4, paddingTop: 4 }}>
          <div>Hormuz oil dep: <span style={{ color: '#cdd6f4' }}>{data.hormuz_oil_dependency_pct}%</span></div>
          <div>Fertilizer exp: <span style={{ color: '#cdd6f4' }}>{data.fertilizer_import_exposure.toUpperCase()}</span></div>
          <div>Iran trade: <span style={{ color: '#cdd6f4' }}>${data.trade_with_iran_usd_bn}B/yr</span></div>
        </div>
      </div>
    </div>
  )
}

// ── Custom bar tooltip ────────────────────────────────────────────────────────
const BarTooltip = ({ active, payload, warAlpha }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const score = compositeScore(d, warAlpha)
  return (
    <div style={{
      background: '#2a2f4a', border: '1px solid #3a4060',
      padding: '8px 12px', fontFamily: 'monospace', fontSize: 11,
    }}>
      <div style={{ color: '#cdd6f4', fontWeight: 'bold', marginBottom: 2 }}>{d.country}</div>
      <div style={{ color: scoreToColor(score), fontSize: 13, fontWeight: 'bold' }}>
        Score: {score.toFixed(1)}
      </div>
      <div style={{ color: '#a6adc8', marginTop: 4, fontSize: 10, lineHeight: 1.7 }}>
        <div>Economy: <span style={{ color: '#89b4fa' }}>{d.economy_score.toFixed(2)}</span></div>
        <div>War:     <span style={{ color: '#ef4444' }}>{d.war_score.toFixed(2)}</span></div>
        <div style={{ color: '#585b70', marginTop: 2 }}>
          {PROXIMITY_LABELS[d.war_proximity] ?? '—'} proximity
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function GeoImpactTab() {
  const [tooltip, setTooltip]   = useState(null)
  const [warAlpha, setWarAlpha] = useState(50)   // 0 = pure economy, 100 = pure war

  // Recompute derived data whenever slider moves
  const ranked = useMemo(() =>
    [...countryData]
      .map(d => ({ ...d, _score: compositeScore(d, warAlpha) }))
      .sort((a, b) => b._score - a._score),
    [warAlpha]
  )

  const top15          = ranked.slice(0, 15)
  const severelyExposed = ranked.filter(d => d._score >= 7)
  const topCountry      = ranked[0]

  // Build a lookup by iso_numeric with reactive score for map coloring
  const scoredByNumeric = useMemo(() => {
    const map = {}
    ranked.forEach(d => { map[String(d.iso_numeric)] = d })
    return map
  }, [ranked])

  const handleMouseEnter = useCallback((data, evt) => {
    setTooltip({ data, x: evt.clientX, y: evt.clientY })
  }, [])
  const handleMouseMove = useCallback((data, evt) => {
    setTooltip(prev => prev ? { ...prev, x: evt.clientX, y: evt.clientY } : null)
  }, [])
  const handleMouseLeave = useCallback(() => setTooltip(null), [])

  const econPct = 100 - warAlpha
  const warPct  = warAlpha

  return (
    <div className="space-y-4">

      {/* ── Slider ─────────────────────────────────────────────────────────── */}
      <div className="bg-hw-card border border-hw-border p-4">
        <div className="font-mono text-[10px] tracking-[0.2em] text-hw-muted mb-3">
          IMPACT WEIGHT — DRAG TO ADJUST SCORING EMPHASIS
        </div>
        <div className="flex items-center gap-4">
          <div className="text-left w-36 flex-shrink-0">
            <div className="font-mono text-xs font-bold" style={{ color: '#89b4fa' }}>
              ECONOMY {econPct}%
            </div>
            <div className="font-mono text-[10px] text-hw-muted leading-tight mt-0.5">
              Oil dep · Fertilizer<br />Trade exposure
            </div>
          </div>

          <div className="flex-1 relative">
            {/* Track gradient */}
            <div
              className="absolute inset-y-0 top-1/2 -translate-y-1/2 rounded-full pointer-events-none"
              style={{
                height: 4,
                left: 0, right: 0,
                background: `linear-gradient(to right, #89b4fa, #e8b84b ${50}%, #ef4444)`,
                opacity: 0.5,
              }}
            />
            <input
              type="range"
              min={0}
              max={100}
              value={warAlpha}
              onChange={e => setWarAlpha(Number(e.target.value))}
              className="w-full relative"
              style={{
                WebkitAppearance: 'none',
                appearance: 'none',
                height: 4,
                background: 'transparent',
                cursor: 'pointer',
                outline: 'none',
              }}
            />
          </div>

          <div className="text-right w-36 flex-shrink-0">
            <div className="font-mono text-xs font-bold" style={{ color: '#ef4444' }}>
              WAR IMPACT {warPct}%
            </div>
            <div className="font-mono text-[10px] text-hw-muted leading-tight mt-0.5">
              War proximity<br />Refugee · Conflict zone
            </div>
          </div>
        </div>

        {/* Proximity legend */}
        <div className="flex items-center gap-5 mt-3 pt-3 border-t border-hw-border">
          <span className="font-mono text-[10px] text-hw-muted">WAR PROXIMITY:</span>
          {Object.entries(PROXIMITY_LABELS).map(([k, v]) => (
            <div key={k} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: PROXIMITY_COLORS[k] }} />
              <span className="font-mono text-[10px]" style={{ color: PROXIMITY_COLORS[k] }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Metric cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MetricCard
          label="SEVERELY EXPOSED COUNTRIES"
          value={severelyExposed.length}
          unit="countries"
          accent="red"
          description={`Score ≥ 7.0 at current weighting. ${severelyExposed.slice(0, 6).map(d => d.country).join(', ')}${severelyExposed.length > 6 ? '…' : ''}`}
        />
        <MetricCard
          label="HIGHEST EXPOSED COUNTRY"
          value={topCountry.country}
          unit={`${topCountry._score.toFixed(1)} / 10`}
          accent="gold"
          description={`Econ score ${topCountry.economy_score.toFixed(2)} · War score ${topCountry.war_score.toFixed(2)} · ${PROXIMITY_LABELS[topCountry.war_proximity] ?? ''} proximity`}
        />
        <MetricCard
          label="WAR ZONE EXPOSURE"
          value={countryData.filter(d => d.war_proximity === 'direct').length}
          unit="direct-zone countries"
          accent="blue"
          description="Countries with military bases, IRBM range, or active proxy operations in the Iran conflict zone."
        />
      </div>

      {/* ── World map ───────────────────────────────────────────────────────── */}
      <div className="bg-hw-card border border-hw-border p-4">
        <div className="font-mono text-[10px] tracking-[0.2em] text-hw-muted mb-3">
          GLOBAL IMPACT MAP — {econPct}% ECONOMY · {warPct}% WAR WEIGHT · SCORE (1–10)
        </div>

        <div className="flex items-center gap-4 mb-3">
          {[
            { label: 'LOW (< 3)',    color: '#1a1a3a' },
            { label: 'MEDIUM (3–6)', color: '#e8b84b' },
            { label: 'HIGH (7–10)',  color: '#ef4444' },
            { label: 'HORMUZ',       color: '#ef4444', shape: 'star' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              {l.shape === 'star' ? (
                <span style={{ color: l.color, fontSize: 12 }}>★</span>
              ) : (
                <div className="w-4 h-3 rounded-sm" style={{ background: l.color }} />
              )}
              <span className="font-mono text-[10px] text-hw-muted">{l.label}</span>
            </div>
          ))}
        </div>

        <div style={{ background: '#0a0a12', borderRadius: 2 }} className="relative">
          <ComposableMap
            projectionConfig={{ scale: 145, center: [15, 15] }}
            style={{ width: '100%', height: 'auto' }}
            height={420}
          >
            <ZoomableGroup zoom={1}>
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map(geo => {
                    const found = scoredByNumeric[String(parseInt(geo.id))]
                    const fill  = found ? scoreToColor(found._score) : '#1a1a2e'
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={fill}
                        stroke="#0d0d1e"
                        strokeWidth={0.4}
                        style={{
                          default: { outline: 'none' },
                          hover:   { outline: 'none', fill: found ? fill : '#252540', cursor: found ? 'crosshair' : 'default' },
                          pressed: { outline: 'none' },
                        }}
                        onMouseEnter={found ? (evt) => handleMouseEnter(found, evt) : undefined}
                        onMouseMove={found ? (evt) => handleMouseMove(found, evt) : undefined}
                        onMouseLeave={found ? handleMouseLeave : undefined}
                      />
                    )
                  })
                }
              </Geographies>

              {/* Strait of Hormuz marker */}
              <Marker coordinates={[56.5, 26.5]}>
                <circle r={5} fill="#ef4444" opacity={0.9} />
                <circle r={9} fill="none" stroke="#ef4444" strokeWidth={1} opacity={0.4} />
                <text
                  textAnchor="start" x={10} y={4}
                  style={{ fontFamily: 'monospace', fontSize: '7px', fill: '#ef4444', fontWeight: 'bold' }}
                >
                  HORMUZ
                </text>
              </Marker>
            </ZoomableGroup>
          </ComposableMap>

          {tooltip && (
            <MapTooltip
              data={tooltip.data}
              x={tooltip.x}
              y={tooltip.y}
              warAlpha={warAlpha}
            />
          )}
        </div>

        <p className="text-hw-muted text-[10px] font-mono mt-2">
          ECONOMY SCORE = 50% Hormuz oil dep · 35% fertilizer · 15% Iran trade ·
          WAR SCORE = 60% war proximity · 25% refugee impact · 15% Iran trade ·
          Source: IEA/IMF/UNHCR
        </p>
      </div>

      {/* ── Bar chart: top 15 ───────────────────────────────────────────────── */}
      <div className="bg-hw-card border border-hw-border p-4">
        <div className="font-mono text-[10px] tracking-[0.2em] text-hw-muted mb-3">
          TOP 15 MOST EXPOSED — {econPct}% ECONOMY · {warPct}% WAR
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={top15}
              layout="vertical"
              margin={{ top: 4, right: 60, left: 90, bottom: 4 }}
              barSize={14}
            >
              <XAxis
                type="number"
                domain={[0, 10]}
                tick={{ fill: '#a6adc8', fontSize: 9, fontFamily: 'monospace' }}
                axisLine={{ stroke: '#3a4060' }}
                tickLine={false}
                tickFormatter={v => v.toFixed(0)}
              />
              <YAxis
                type="category"
                dataKey="country"
                tick={{ fill: '#cdd6f4', fontSize: 9, fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
                width={85}
              />
              <Tooltip
                content={<BarTooltipWrapper warAlpha={warAlpha} />}
                cursor={{ fill: '#2a2f4a' }}
              />
              <Bar dataKey="_score" radius={[0, 2, 2, 0]}>
                {top15.map(entry => (
                  <Cell key={entry.iso3} fill={scoreToColor(entry._score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] font-mono text-hw-muted">
          <span>THRESHOLD: ≥ 7.0 = SEVERE</span>
          <span>USE SLIDER ABOVE TO ADJUST WEIGHTING</span>
          <span className="text-right">DATA: IEA · IMF · UNHCR ESTIMATES</span>
        </div>
      </div>

      {/* ── Severely exposed detail table ───────────────────────────────────── */}
      <div className="bg-hw-card border border-hw-border p-4">
        <div className="font-mono text-[10px] tracking-[0.2em] text-hw-muted mb-3">
          SEVERELY EXPOSED — DETAIL (SCORE ≥ 7.0 · CURRENT WEIGHTING)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-hw-border">
                {['COUNTRY', 'SCORE', 'ECON', 'WAR', 'PROXIMITY', 'HORMUZ DEP', 'FERTILIZER', 'REFUGEE'].map(h => (
                  <th key={h} className="text-left py-2 px-2 text-hw-muted text-[10px] tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {severelyExposed.map(d => (
                <tr key={d.iso3} className="border-b border-hw-border last:border-0 hover:bg-hw-bg/30">
                  <td className="py-2 px-2 text-hw-text font-semibold">{d.country}</td>
                  <td className="py-2 px-2 font-bold text-sm" style={{ color: scoreToColor(d._score) }}>
                    {d._score.toFixed(1)}
                  </td>
                  <td className="py-2 px-2" style={{ color: '#89b4fa' }}>
                    {d.economy_score.toFixed(2)}
                  </td>
                  <td className="py-2 px-2" style={{ color: '#ef4444' }}>
                    {d.war_score.toFixed(2)}
                  </td>
                  <td className="py-2 px-2">
                    <span style={{
                      color: PROXIMITY_COLORS[d.war_proximity] ?? '#585b70',
                      fontSize: 9,
                      border: `1px solid ${PROXIMITY_COLORS[d.war_proximity] ?? '#585b70'}`,
                      padding: '1px 4px',
                    }}>
                      {PROXIMITY_LABELS[d.war_proximity] ?? '—'}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-hw-sub">{d.hormuz_oil_dependency_pct}%</td>
                  <td className="py-2 px-2">
                    <span className={
                      d.fertilizer_import_exposure === 'high'   ? 'text-red-400'    :
                      d.fertilizer_import_exposure === 'medium' ? 'text-yellow-400' : 'text-hw-muted'
                    }>
                      {d.fertilizer_import_exposure.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2 px-2">
                    <span className={
                      d.refugee_impact === 'high'   ? 'text-red-400'    :
                      d.refugee_impact === 'medium' ? 'text-yellow-400' : 'text-hw-muted'
                    }>
                      {d.refugee_impact.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Wrapper to pass warAlpha into recharts custom tooltip
function BarTooltipWrapper(props) {
  return <BarTooltip {...props} warAlpha={props.warAlpha} />
}
