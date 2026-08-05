import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ReferenceLine, ResponsiveContainer, LabelList,
} from 'recharts'
import { Stat, Panel, CHART, ChartTooltip } from '../ui.jsx'
import { oilPrices as staticOilPrices, oilEventDates as staticOilEventDates } from '../../data/oilPrices.js'
import { attByPhase as staticAttByPhase, syntheticControl as staticSC, oilStats as staticOilStats } from '../../data/metrics.js'
import { ExploratoryBanner } from '../ui.jsx'

// Series colours come from the validated set in ui.jsx, assigned in fixed
// order so a filter can never repaint a series.
const CHART_STYLE = {
  border: CHART.grid,
  text: CHART.axis,
  grid: CHART.grid,
  brent: CHART.series[0],
  wti: CHART.series[1],
  gold: CHART.series[3],
  blue: CHART.series[0],
  marker: CHART.context,
}

const formatDate = (d) => {
  if (!d) return ''
  const dt = new Date(d + 'T00:00:00')
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const CHART_START = '2025-11-01'

export default function EnergyTab() {

  const oilPrices    = staticOilPrices
  const oilEventDates = staticOilEventDates
  const sc           = staticSC
  const attByPhase   = staticAttByPhase
  const oilStats     = staticOilStats

  const chartOil = oilPrices.filter(d => d.date >= CHART_START)

  return (
    <div className="space-y-6">

      <ExploratoryBanner>
        Nothing on this tab is a reported finding. The synthetic control failed its own placebo
        test and returned a negative estimate; the difference-in-differences has an effective
        sample size of four.
      </ExploratoryBanner>

      {/* Withdrawn estimates */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat
          label="Spot estimate — withdrawn"
          value={`+$${sc.spotATT}`}
          unit="/bbl"
          note="Not a result. 20.2% of this counterfactual is a Dubai series whose last observation predates treatment and is held flat, so the gap grows by construction."
        />
        <Stat
          label="Futures estimate — withdrawn"
          value={`+$${sc.futuresATT}`}
          unit="/bbl"
          note="Not a synthetic control. With one donor the convexity constraint pins the weight to 1.0, making this the demeaned Brent–WTI spread."
        />
        <Stat
          label="Basis spread — withdrawn"
          value={`$${sc.basisSpread}`}
          unit="/bbl"
          note="Arithmetic on the two figures beside it, not an independent estimate. Carries no information they do not already contain."
        />
      </div>

      {/* Oil indexed price chart */}
      <div className="bg-surface border border-line p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-micro text-ink-3">
            BRENT &amp; WTI — INDEXED TO 100 ON FEB 28, 2026
          </span>
          <div className="flex items-center gap-4">
            {[
              { label: 'Brent (BZ=F)', color: CHART_STYLE.brent },
              { label: 'WTI (CL=F)',   color: CHART_STYLE.wti   },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-4 h-0.5" style={{ background: l.color }} />
                <span className="font-mono text-micro text-ink-3">{l.label}</span>
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
                tick={{ fill: CHART_STYLE.text, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                interval={19}
                axisLine={{ stroke: CHART_STYLE.border }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: CHART_STYLE.text, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `${v}`}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: CHART.grid }} />
              <ReferenceLine
                x={oilEventDates.t1}
                stroke={CHART_STYLE.marker}
                strokeDasharray="4 4"
                strokeOpacity={0.7}
                label={{ value: 'Strikes', fill: CHART.axis, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
              />
              <ReferenceLine
                x={oilEventDates.t2}
                stroke={CHART_STYLE.marker}
                strokeDasharray="4 4"
                strokeOpacity={0.7}
                label={{ value: 'Closure', fill: CHART.axis, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
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
               isAnimationActive={false} />
              <Line
                type="monotone"
                dataKey="wtiIdx"
                stroke={CHART_STYLE.wti}
                strokeWidth={2}
                dot={false}
                name="WTI (CL=F)"
                connectNulls
               isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 flex gap-6 text-micro font-mono text-ink-3">
          <span>BASE: Brent ${oilStats.brentBase} · WTI ${oilStats.wtiBase} (Feb 28)</span>
          <span>BRENT PEAK: ${oilStats.brentPeak} (EIA spot)</span>
          <span>WTI PEAK: ${oilStats.wtiPeak}</span>
        </div>
      </div>

      {/* ATT by phase bar chart */}
      <div className="bg-surface border border-line p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-micro text-ink-3">
            AVERAGE TREATMENT EFFECT BY PHASE — SPOT vs FUTURES ($/BBL)
          </span>
          <div className="flex items-center gap-4">
            {[
              { label: 'Spot ATT (EIA)', color: CHART_STYLE.gold },
              { label: 'Futures ATT',   color: CHART_STYLE.blue  },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-3 h-3" style={{ background: l.color, opacity: 0.8 }} />
                <span className="font-mono text-micro text-ink-3">{l.label}</span>
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
                tick={{ fill: CHART_STYLE.text, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                axisLine={{ stroke: CHART_STYLE.border }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: CHART_STYLE.text, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `$${v}`}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: CHART.grid }} />
              <Bar dataKey="spotATT" fill={CHART_STYLE.gold} name="Spot ATT ($/bbl)" fillOpacity={0.85} radius={[1,1,0,0]} isAnimationActive={false}>
                <LabelList
                  dataKey="spotATT"
                  position="top"
                  formatter={v => `$${v}`}
                  style={{ fill: CHART_STYLE.gold, fontSize: 9, fontFamily: 'monospace' }}
                />
              </Bar>
              <Bar dataKey="futuresATT" fill={CHART_STYLE.blue} name="Futures ATT ($/bbl)" fillOpacity={0.85} radius={[1,1,0,0]} isAnimationActive={false}>
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

        <p className="text-ink-3 text-xs font-sans mt-2 leading-relaxed">
          Spot ATT uses FRED Brent ~ Dubai synthetic (Dubai forward-filled from Feb 2026 — inflates post-period values).
          Futures ATT is the cleaner estimate: change in Brent-WTI futures spread post-treatment, demeaned by pre-period mean.
        </p>
      </div>
    </div>
  )
}
