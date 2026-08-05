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
import { Stat } from './ui.jsx'
import { ExploratoryBanner } from './ui.jsx'
// Vendored from world-atlas@2 so the archive makes no runtime network calls.
// react-simple-maps accepts a topojson object directly, not just a URL.
import worldAtlas from '../data/countries-110m.json'


// ── Sequential ramp ──────────────────────────────────────────────────────────
// Score is a magnitude, so the encoding is a single hue running dark → light,
// not a rainbow. The previous dark→gold→red ramp implied three categories where
// the data has one ordered dimension, and put a hue at the midpoint.
const RAMP = ['#dbe7f6', '#b7cfec', '#8db3e1', '#5f93d4', '#3576c4', '#1d68c3']

function scoreToColor(score) {
  if (score == null || score === 0) return '#eef1f4'
  const t = Math.min(10, Math.max(0, score)) / 10
  return RAMP[Math.min(RAMP.length - 1, Math.floor(t * RAMP.length))]
}

// ── Composite score computation ───────────────────────────────────────────────
function compositeScore(d, warAlpha) {
  const w = warAlpha / 100
  return parseFloat((w * d.war_score + (1 - w) * d.economy_score).toFixed(2))
}

// ── War proximity badge ───────────────────────────────────────────────────────
// Proximity is ordered, not categorical — one hue, stepped by intensity.
const PROXIMITY_COLORS = {
  direct:     '#c0272d',
  proximate:  '#cf5b52',
  regional:   '#d98d80',
  remote:     '#8a949e',
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
        background: '#ffffff',
        border: '1px solid #e2e6ea',
        borderLeft: `3px solid ${scoreColor}`,
        padding: '8px 12px',
        fontFamily: 'monospace',
        fontSize: 11,
        maxWidth: 260,
        boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
      }}
    >
      <div style={{ color: '#10151a', fontWeight: 'bold', marginBottom: 4, fontSize: 12 }}>
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
      <div style={{ color: '#4a545e', lineHeight: 1.8, fontSize: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span>Economy score</span>
          <span style={{ color: '#1d68c3' }}>{data.economy_score.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span>War score</span>
          <span style={{ color: '#c0272d' }}>{data.war_score.toFixed(2)}</span>
        </div>
        <div style={{ borderTop: '1px solid #e2e6ea', marginTop: 4, paddingTop: 4 }}>
          <div>Hormuz oil dep: <span style={{ color: '#10151a' }}>{data.hormuz_oil_dependency_pct}%</span></div>
          <div>Fertilizer exp: <span style={{ color: '#10151a' }}>{data.fertilizer_import_exposure.toUpperCase()}</span></div>
          <div>Iran trade: <span style={{ color: '#10151a' }}>${data.trade_with_iran_usd_bn}B/yr</span></div>
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
      background: '#ffffff', border: '1px solid #e2e6ea',
      padding: '8px 12px', fontFamily: 'monospace', fontSize: 11,
    }}>
      <div style={{ color: '#10151a', fontWeight: 'bold', marginBottom: 2 }}>{d.country}</div>
      <div style={{ color: scoreToColor(score), fontSize: 13, fontWeight: 'bold' }}>
        Score: {score.toFixed(1)}
      </div>
      <div style={{ color: '#4a545e', marginTop: 4, fontSize: 10, lineHeight: 1.7 }}>
        <div>Economy: <span style={{ color: '#1d68c3' }}>{d.economy_score.toFixed(2)}</span></div>
        <div>War:     <span style={{ color: '#c0272d' }}>{d.war_score.toFixed(2)}</span></div>
        <div style={{ color: '#8a949e', marginTop: 2 }}>
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

      <ExploratoryBanner>
        These impact scores are a hand-assigned index, not an estimate. There is no identification
        strategy, no uncertainty, and no way to falsify them.
      </ExploratoryBanner>

      {/* ── Slider ─────────────────────────────────────────────────────────── */}
      <div className="bg-surface border border-line p-4">
        <div className="font-mono text-micro text-ink-3 mb-3">
          IMPACT WEIGHT — DRAG TO ADJUST SCORING EMPHASIS
        </div>
        <div className="flex items-center gap-4">
          <div className="text-left w-36 flex-shrink-0">
            <div className="font-mono text-xs font-bold" style={{ color: '#1d68c3' }}>
              ECONOMY {econPct}%
            </div>
            <div className="font-mono text-micro text-ink-3 leading-tight mt-0.5">
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
                background: 'linear-gradient(to right, #1d68c3, #8a949e 50%, #c0272d)',
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
            <div className="font-mono text-xs font-bold" style={{ color: '#c0272d' }}>
              WAR IMPACT {warPct}%
            </div>
            <div className="font-mono text-micro text-ink-3 leading-tight mt-0.5">
              War proximity<br />Refugee · Conflict zone
            </div>
          </div>
        </div>

        {/* Proximity legend */}
        <div className="flex items-center gap-5 mt-3 pt-3 border-t border-line">
          <span className="font-mono text-micro text-ink-3">WAR PROXIMITY:</span>
          {Object.entries(PROXIMITY_LABELS).map(([k, v]) => (
            <div key={k} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: PROXIMITY_COLORS[k] }} />
              <span className="font-mono text-micro" style={{ color: PROXIMITY_COLORS[k] }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Metric cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat
          label="Scored ≥ 7.0"
          value={severelyExposed.length}
          unit="countries"
          note={`At the current weighting. ${severelyExposed.slice(0, 6).map(d => d.country).join(', ')}${severelyExposed.length > 6 ? '…' : ''}`}
        />
        <Stat
          label="Highest scored"
          value={topCountry.country}
          unit={`${topCountry._score.toFixed(1)} / 10`}
          note={`Economy ${topCountry.economy_score.toFixed(2)} · War ${topCountry.war_score.toFixed(2)} · ${PROXIMITY_LABELS[topCountry.war_proximity] ?? ''} proximity`}
        />
        <Stat
          label="Direct-zone countries"
          value={countryData.filter(d => d.war_proximity === 'direct').length}
          unit="countries"
          note="Hand-assigned: military bases, IRBM range, or active proxy operations in the conflict zone."
        />
      </div>

      {/* ── World map ───────────────────────────────────────────────────────── */}
      <div className="bg-surface border border-line p-4">
        <div className="font-mono text-micro text-ink-3 mb-3">
          GLOBAL IMPACT MAP — {econPct}% ECONOMY · {warPct}% WAR WEIGHT · SCORE (1–10)
        </div>

        {/* Sequential legend: one ordered ramp, ends labelled */}
        <div className="mb-3 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-micro text-ink-3">0</span>
            <div className="flex" role="img" aria-label="Impact score ramp, 0 to 10">
              {RAMP.map(c => (
                <span key={c} className="h-3 w-6 first:rounded-l-sm last:rounded-r-sm" style={{ background: c }} />
              ))}
            </div>
            <span className="font-mono text-micro text-ink-3">10</span>
            <span className="text-label text-ink-3">impact score</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span style={{ color: '#10151a', fontSize: 12 }}>★</span>
            <span className="text-label text-ink-3">Strait of Hormuz</span>
          </div>
        </div>

        <div className="relative rounded bg-bg">
          <ComposableMap
            projectionConfig={{ scale: 145, center: [15, 15] }}
            style={{ width: '100%', height: 'auto' }}
            height={420}
          >
            <ZoomableGroup zoom={1}>
              <Geographies geography={worldAtlas}>
                {({ geographies }) =>
                  geographies.map(geo => {
                    const found = scoredByNumeric[String(parseInt(geo.id))]
                    const fill  = found ? scoreToColor(found._score) : '#eef1f4'
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={fill}
                        stroke="#f7f8f9"
                        strokeWidth={0.4}
                        style={{
                          default: { outline: 'none' },
                          hover:   { outline: 'none', fill: found ? fill : '#ffffff', cursor: found ? 'crosshair' : 'default' },
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
                <circle r={5} fill="#c0272d" opacity={0.9} />
                <circle r={9} fill="none" stroke="#c0272d" strokeWidth={1} opacity={0.4} />
                <text
                  textAnchor="start" x={10} y={4}
                  style={{ fontFamily: 'monospace', fontSize: '7px', fill: '#c0272d', fontWeight: 'bold' }}
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

        <p className="text-ink-3 text-micro font-mono mt-2">
          ECONOMY SCORE = 50% Hormuz oil dep · 35% fertilizer · 15% Iran trade ·
          WAR SCORE = 60% war proximity · 25% refugee impact · 15% Iran trade ·
          Source: IEA/IMF/UNHCR
        </p>
      </div>

      {/* ── Bar chart: top 15 ───────────────────────────────────────────────── */}
      <div className="bg-surface border border-line p-4">
        <div className="font-mono text-micro text-ink-3 mb-3">
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
                tick={{ fill: '#4a545e', fontSize: 9, fontFamily: 'monospace' }}
                axisLine={{ stroke: '#e2e6ea' }}
                tickLine={false}
                tickFormatter={v => v.toFixed(0)}
              />
              <YAxis
                type="category"
                dataKey="country"
                tick={{ fill: '#10151a', fontSize: 9, fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
                width={85}
              />
              <Tooltip
                content={<BarTooltipWrapper warAlpha={warAlpha} />}
                cursor={{ fill: '#ffffff' }}
              />
              <Bar dataKey="_score" radius={[0, 2, 2, 0]} isAnimationActive={false}>
                {top15.map(entry => (
                  <Cell key={entry.iso3} fill={scoreToColor(entry._score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-micro font-mono text-ink-3">
          <span>THRESHOLD: ≥ 7.0 = SEVERE</span>
          <span>USE SLIDER ABOVE TO ADJUST WEIGHTING</span>
          <span className="text-right">DATA: IEA · IMF · UNHCR ESTIMATES</span>
        </div>
      </div>

      {/* ── Severely exposed detail table ───────────────────────────────────── */}
      <div className="bg-surface border border-line p-4">
        <div className="font-mono text-micro text-ink-3 mb-3">
          SEVERELY EXPOSED — DETAIL (SCORE ≥ 7.0 · CURRENT WEIGHTING)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-line">
                {['COUNTRY', 'SCORE', 'ECON', 'WAR', 'PROXIMITY', 'HORMUZ DEP', 'FERTILIZER', 'REFUGEE'].map(h => (
                  <th key={h} className="text-left py-2 px-2 text-ink-3 text-micro">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {severelyExposed.map(d => (
                <tr key={d.iso3} className="border-b border-line last:border-0 hover:bg-bg/30">
                  <td className="py-2 px-2 text-ink font-semibold">{d.country}</td>
                  <td className="py-2 px-2 font-bold text-sm" style={{ color: scoreToColor(d._score) }}>
                    {d._score.toFixed(1)}
                  </td>
                  <td className="py-2 px-2" style={{ color: '#1d68c3' }}>
                    {d.economy_score.toFixed(2)}
                  </td>
                  <td className="py-2 px-2" style={{ color: '#c0272d' }}>
                    {d.war_score.toFixed(2)}
                  </td>
                  <td className="py-2 px-2">
                    <span style={{
                      color: PROXIMITY_COLORS[d.war_proximity] ?? '#8a949e',
                      fontSize: 9,
                      border: `1px solid ${PROXIMITY_COLORS[d.war_proximity] ?? '#8a949e'}`,
                      padding: '1px 4px',
                    }}>
                      {PROXIMITY_LABELS[d.war_proximity] ?? '—'}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-ink-2">{d.hormuz_oil_dependency_pct}%</td>
                  <td className="py-2 px-2">
                    <span className={
                      d.fertilizer_import_exposure === 'high'   ? 'text-red-400'    :
                      d.fertilizer_import_exposure === 'medium' ? 'text-yellow-400' : 'text-ink-3'
                    }>
                      {d.fertilizer_import_exposure.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2 px-2">
                    <span className={
                      d.refugee_impact === 'high'   ? 'text-red-400'    :
                      d.refugee_impact === 'medium' ? 'text-yellow-400' : 'text-ink-3'
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
