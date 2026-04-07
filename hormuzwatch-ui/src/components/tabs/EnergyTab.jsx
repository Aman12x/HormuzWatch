import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ReferenceLine, ResponsiveContainer, LabelList,
} from 'recharts'
import MetricCard from '../MetricCard.jsx'
import { oilPrices, oilEventDates } from '../../data/oilPrices.js'
import { attByPhase, syntheticControl, oilStats } from '../../data/metrics.js'

const CHART_STYLE = {
  bg     : '#232840',
  border : '#3a4060',
  text   : '#94a3b8',
  grid   : '#3a4060',
  brent  : '#a78bfa',
  wti    : '#ef4444',
  gold   : '#e8b84b',
  blue   : '#3b82f6',
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#232840', border: '1px solid #3a4060',
      padding: '8px 12px', fontSize: 11, fontFamily: 'monospace',
    }}>
      <p style={{ color: '#94a3b8', marginBottom: 4 }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</strong>
          {p.name.includes('ATT') ? ' $/bbl' : ''}
        </div>
      ))}
    </div>
  )
}

const formatDate = (d) => {
  if (!d) return ''
  const dt = new Date(d + 'T00:00:00')
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Filter oil data: show from ~Oct 2025 to present
const CHART_START = '2025-11-01'
const chartOil = oilPrices.filter(d => d.date >= CHART_START)

export default function EnergyTab() {
  return (
    <div className="space-y-4">

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MetricCard
          label="SPOT ATT (EIA BRENT)"
          value={`+$${syntheticControl.spotATT}`}
          unit="/bbl"
          accent="gold"
          description="FRED Brent above Dubai synthetic. Note: Dubai data ends Feb 2026; spot ATT inflated by frozen synthetic. Tightens on March data."
        />
        <MetricCard
          label="FUTURES ATT (CAUSAL)"
          value={`+$${syntheticControl.futuresATT}`}
          unit="/bbl"
          accent="blue"
          description="Change in Brent-WTI futures spread (BZ=F − CL=F) post-treatment. Cleanest causal estimate: $3.51 Hormuz risk premium priced by paper market."
        />
        <MetricCard
          label="BASIS SPREAD"
          value={`$${syntheticControl.basisSpread}`}
          unit="/bbl"
          accent="red"
          description="Spot ATT minus futures ATT. Physical backwardation: refineries paying acute spot premiums futures curve hasn't yet priced."
        />
      </div>

      {/* Oil indexed price chart */}
      <div className="bg-hw-card border border-hw-border p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] tracking-[0.2em] text-hw-muted">
            BRENT &amp; WTI — INDEXED TO 100 ON FEB 28, 2026
          </span>
          <div className="flex items-center gap-4">
            {[
              { label: 'Brent (BZ=F)', color: CHART_STYLE.brent },
              { label: 'WTI (CL=F)',   color: CHART_STYLE.wti   },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-4 h-0.5" style={{ background: l.color }} />
                <span className="font-mono text-[10px] text-hw-muted">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartOil} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={CHART_STYLE.grid}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fill: CHART_STYLE.text, fontSize: 10, fontFamily: 'monospace' }}
                interval={19}
                axisLine={{ stroke: CHART_STYLE.border }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: CHART_STYLE.text, fontSize: 10, fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `${v}`}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                x={oilEventDates.t1}
                stroke={CHART_STYLE.gold}
                strokeDasharray="4 4"
                strokeOpacity={0.7}
                label={{ value: 'T1 Strike', fill: CHART_STYLE.gold, fontSize: 9, fontFamily: 'monospace' }}
              />
              <ReferenceLine
                x={oilEventDates.t2}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeOpacity={0.7}
                label={{ value: 'T2 Hormuz', fill: '#ef4444', fontSize: 9, fontFamily: 'monospace' }}
              />
              <ReferenceLine y={100} stroke={CHART_STYLE.grid} strokeDasharray="2 2" strokeOpacity={0.6} />
              <Line
                type="monotone"
                dataKey="brentIdx"
                stroke={CHART_STYLE.brent}
                strokeWidth={2}
                dot={false}
                name="Brent (BZ=F)"
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="wtiIdx"
                stroke={CHART_STYLE.wti}
                strokeWidth={2}
                dot={false}
                name="WTI (CL=F)"
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 flex gap-6 text-[10px] font-mono text-hw-muted">
          <span>BASE: Brent ${oilStats.brentBase} · WTI ${oilStats.wtiBase} (Feb 28)</span>
          <span>BRENT PEAK: ${oilStats.brentPeak} (EIA spot)</span>
          <span>WTI PEAK: ${oilStats.wtiPeak}</span>
        </div>
      </div>

      {/* ATT by phase bar chart */}
      <div className="bg-hw-card border border-hw-border p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] tracking-[0.2em] text-hw-muted">
            AVERAGE TREATMENT EFFECT BY PHASE — SPOT vs FUTURES ($/BBL)
          </span>
          <div className="flex items-center gap-4">
            {[
              { label: 'Spot ATT (EIA)', color: CHART_STYLE.gold },
              { label: 'Futures ATT',   color: CHART_STYLE.blue  },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-3 h-3" style={{ background: l.color, opacity: 0.8 }} />
                <span className="font-mono text-[10px] text-hw-muted">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={attByPhase} margin={{ top: 10, right: 20, left: 0, bottom: 5 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.grid} vertical={false} />
              <XAxis
                dataKey="phase"
                tick={{ fill: CHART_STYLE.text, fontSize: 10, fontFamily: 'monospace' }}
                axisLine={{ stroke: CHART_STYLE.border }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: CHART_STYLE.text, fontSize: 10, fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `$${v}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="spotATT" fill={CHART_STYLE.gold} name="Spot ATT ($/bbl)" fillOpacity={0.85} radius={[1,1,0,0]}>
                <LabelList
                  dataKey="spotATT"
                  position="top"
                  formatter={v => `$${v}`}
                  style={{ fill: CHART_STYLE.gold, fontSize: 9, fontFamily: 'monospace' }}
                />
              </Bar>
              <Bar dataKey="futuresATT" fill={CHART_STYLE.blue} name="Futures ATT ($/bbl)" fillOpacity={0.85} radius={[1,1,0,0]}>
                <LabelList
                  dataKey="futuresATT"
                  position="top"
                  formatter={v => `$${v}`}
                  style={{ fill: CHART_STYLE.blue, fontSize: 9, fontFamily: 'monospace' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <p className="text-hw-muted text-xs font-inter mt-2 leading-relaxed">
          Spot ATT uses FRED Brent ~ Dubai synthetic (Dubai forward-filled from Feb 2026 — inflates post-period values).
          Futures ATT is the cleaner estimate: change in Brent-WTI futures spread post-treatment, demeaned by pre-period mean.
        </p>
      </div>
    </div>
  )
}
