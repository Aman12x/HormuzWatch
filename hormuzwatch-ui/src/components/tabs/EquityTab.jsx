import {
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts'
import { Stat, Panel, CHART, ChartTooltip } from '../ui.jsx'
import { equitiesCAR as staticEquitiesCAR } from '../../data/equities.js'
import {
  equityStats as staticEquityStats,
  tickerCAR as staticTickerCAR,
  shippingPlacebo as staticShippingPlacebo,
} from '../../data/metrics.js'
import { ExploratoryBanner } from '../ui.jsx'

// Fixed-order assignment from the validated categorical set. The control
// basket is additionally dashed, so identity never rests on colour alone.
const COLORS = {
  defense: CHART.series[0],
  energy: CHART.series[1],
  shipping_hormuz: CHART.series[2],
  shipping_ctrl: CHART.context,
}
const GRID = CHART.grid
const TEXT = CHART.axis

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#ffffff', border: '1px solid #e2e6ea',
      padding: '8px 12px', fontSize: 11, fontFamily: 'monospace',
    }}>
      <p style={{ color: '#626c76', marginBottom: 4 }}>
        {label > 0 ? `+${label}d` : label === 0 ? 'T0 (Strike)' : `${label}d`}
      </p>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{p.value > 0 ? '+' : ''}{p.value?.toFixed(2)}%</strong>
        </div>
      ))}
    </div>
  )
}

const formatT = t => t === 0 ? 'T0' : (t > 0 ? `+${t}` : `${t}`)

export default function EquityTab() {

  const equitiesCAR    = staticEquitiesCAR
  const equityStats    = staticEquityStats
  const tickerCAR      = staticTickerCAR
  const shippingPlacebo = staticShippingPlacebo

  const lastPoint = equitiesCAR[equitiesCAR.length - 1] || {}

  return (
    <div className="space-y-6">

      <ExploratoryBanner>
        Nothing on this tab is a reported finding. These cumulative abnormal returns come from
        market models with almost no explanatory power (R² 0.000–0.022), and no test statistic is
        computed on any of them.
      </ExploratoryBanner>

      {/* Sector statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat
          label="Defense sector CAR"
          value={`${equityStats.defense.car.toFixed(1)}%`}
          note={`LMT ${(tickerCAR.LMT ?? 0).toFixed(1)}% · RTX ${(tickerCAR.RTX ?? 0).toFixed(1)}% · NOC ${(tickerCAR.NOC ?? 0).toFixed(1)}%. Descriptive: the market model explains ≈0% of variance against SPY, so this is close to a raw return.`}
        />
        <Stat
          label="Energy sector CAR"
          value={`${equityStats.energy.car >= 0 ? '+' : ''}${equityStats.energy.car.toFixed(1)}%`}
          note={`BP ${(tickerCAR.BP ?? 0) >= 0 ? '+' : ''}${(tickerCAR.BP ?? 0).toFixed(1)}% · CVX ${(tickerCAR.CVX ?? 0).toFixed(1)}% · XOM ${(tickerCAR.XOM ?? 0).toFixed(1)}%. Spread is driven by BP's upstream exposure. No test statistic is computed on any CAR here.`}
        />
        <Stat
          label="Hormuz tanker CAR"
          value={`${equityStats.shipping_hormuz.car.toFixed(1)}%`}
          note={`FRO ${(tickerCAR.FRO ?? 0).toFixed(1)}% · STNG ${(tickerCAR.STNG ?? 0).toFixed(1)}%. Two tickers, market-model R² 0.001–0.004.`}
        />
        <Stat
          label="Route gap — not significant"
          value={`${shippingPlacebo.gap.toFixed(1)}pp`}
          note={`Hormuz ${shippingPlacebo.hormuzCAR.toFixed(1)}% vs control ${shippingPlacebo.nonHormuzCAR.toFixed(1)}%. Exact permutation over all 15 route splits ranks this second, p = ${shippingPlacebo.pPermutation}; the smallest attainable p is ${shippingPlacebo.minAttainableP}.`}
        />
      </div>

      {/* CAR chart */}
      <div className="bg-surface border border-line p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-micro text-ink-3">
            CUMULATIVE ABNORMAL RETURN BY SECTOR — MARKET MODEL OLS (t = −5 to +{lastPoint.t ?? 23})
          </span>
          <div className="flex items-center gap-4 flex-wrap">
            {[
              { key: 'defense',         label: 'Defense',          color: COLORS.defense },
              { key: 'energy',          label: 'Energy',           color: COLORS.energy },
              { key: 'shipping_hormuz', label: 'Shipping (Hormuz)',color: COLORS.shipping_hormuz },
              { key: 'shipping_ctrl',   label: 'Shipping (Ctrl)',  color: COLORS.shipping_ctrl, dashed: true },
            ].map(({ key, label, color, dashed }) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className="w-4 h-0.5" style={{
                  background: color,
                  ...(dashed ? { backgroundImage: `repeating-linear-gradient(to right, ${color} 0, ${color} 4px, transparent 4px, transparent 7px)`, background: 'none' } : {}),
                  borderTop: dashed ? `2px dashed ${color}` : undefined,
                }} />
                <span className="font-mono text-micro text-ink-3">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={equitiesCAR} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis
                dataKey="t"
                tickFormatter={formatT}
                tick={{ fill: TEXT, fontSize: 10, fontFamily: 'monospace' }}
                axisLine={{ stroke: GRID }}
                tickLine={false}
                interval={4}
                label={{
                  value: 'Trading days relative to Feb 28 strike',
                  position: 'insideBottom',
                  offset: -2,
                  fill: TEXT,
                  fontSize: 10,
                  fontFamily: 'monospace',
                }}
              />
              <YAxis
                tick={{ fill: TEXT, fontSize: 10, fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `${v > 0 ? '+' : ''}${v.toFixed(0)}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              {/* Zero line */}
              <ReferenceLine y={0} stroke={GRID} strokeWidth={1} />
              {/* Event line */}
              <ReferenceLine
                x={0}
                stroke={CHART.context}
                strokeDasharray="4 4"
                strokeOpacity={0.8}
                label={{
                  value: 'Strikes', position: 'top',
                  fill: CHART.axis, fontSize: 10, fontFamily: 'monospace',
                }}
              />
              <Line type="monotone" dataKey="defense"         stroke={COLORS.defense}         strokeWidth={2} dot={false} name="Defense"  isAnimationActive={false} />
              <Line type="monotone" dataKey="energy"           stroke={COLORS.energy}           strokeWidth={2} dot={false} name="Energy"  isAnimationActive={false} />
              <Line type="monotone" dataKey="shipping_hormuz"  stroke={COLORS.shipping_hormuz}  strokeWidth={2} dot={false} name="Shipping (Hormuz)"  isAnimationActive={false} />
              <Line type="monotone" dataKey="shipping_ctrl"    stroke={COLORS.shipping_ctrl}    strokeWidth={2} dot={false} name="Shipping (Ctrl)" strokeDasharray="4 3"  isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <p className="mt-3 max-w-prose text-label leading-6 text-ink-3">
          CAR normalized to 0 at t=−1. Estimation window Nov 2025 – 27 Feb 2026, SPY as market
          factor. Pre-period R² of 0.001–0.082 means the market model explains almost none of these
          stocks&rsquo; variance, so these &ldquo;abnormal&rdquo; returns are close to raw returns.
          No standard error or test statistic is computed on any CAR here.
        </p>
      </div>

      {/* Individual ticker table + shipping paradox */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Ticker CARs */}
        <div className="bg-surface border border-line p-4">
          <div className="font-mono text-micro text-ink-3 mb-3">
            INDIVIDUAL TICKER CAR (FULL POST-PERIOD)
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-line">
                {['TICKER', 'SECTOR', 'CAR'].map(h => (
                  <th key={h} className="text-left py-1.5 font-mono text-micro text-ink-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { t: 'LMT',   s: 'Defense',          c: tickerCAR.LMT   },
                { t: 'RTX',   s: 'Defense',          c: tickerCAR.RTX   },
                { t: 'NOC',   s: 'Defense',          c: tickerCAR.NOC   },
                { t: 'BP',    s: 'Energy',           c: tickerCAR.BP    },
                { t: 'CVX',   s: 'Energy',           c: tickerCAR.CVX   },
                { t: 'XOM',   s: 'Energy',           c: tickerCAR.XOM   },
                { t: 'FRO',   s: 'Ship (Hormuz)',    c: tickerCAR.FRO   },
                { t: 'STNG',  s: 'Ship (Hormuz)',    c: tickerCAR.STNG  },
                { t: 'HAFNI', s: 'Ship (Ctrl)',      c: tickerCAR.HAFNI },
                { t: 'INSW',  s: 'Ship (Ctrl)',      c: tickerCAR.INSW  },
                { t: 'NAT',   s: 'Ship (Ctrl)',      c: tickerCAR.NAT   },
                { t: 'TK',    s: 'Ship (Ctrl)',      c: tickerCAR.TK    },
              ].map(row => (
                <tr key={row.t} className="border-b border-line last:border-0">
                  <td className="py-2 font-mono font-semibold text-ink text-sm">{row.t}</td>
                  <td className="py-2 font-mono text-xs text-ink-3">{row.s}</td>
                  <td className="py-2 font-mono font-semibold text-sm" style={{
                    color: row.c >= 0 ? '#12805a' : '#c0272d'
                  }}>
                    {row.c >= 0 ? '+' : ''}{row.c.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Route-exposure placebo test */}
        <div className="bg-surface border border-line p-4">
          <div className="font-mono text-micro text-ink-3 mb-3">
            ROUTE-EXPOSURE PLACEBO TEST
          </div>
          <div className="space-y-3 text-ink-2 text-sm font-sans leading-relaxed">

            {/* Gap summary */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-bg border border-line p-2">
                <div className="font-mono text-micro text-ink-3 mb-1">HORMUZ BASKET</div>
                <div className="font-mono font-bold text-base" style={{ color: '#c0272d' }}>
                  {shippingPlacebo.hormuzCAR.toFixed(1)}%
                </div>
                <div className="font-mono text-micro text-ink-3 mt-0.5">FRO · STNG</div>
              </div>
              <div className="bg-bg border border-line p-2">
                <div className="font-mono text-micro text-ink-3 mb-1">CTRL BASKET</div>
                <div className="font-mono font-bold text-base" style={{ color: '#626c76' }}>
                  {shippingPlacebo.nonHormuzCAR.toFixed(1)}%
                </div>
                <div className="font-mono text-micro text-ink-3 mt-0.5">HAFNI · INSW · NAT · TK</div>
              </div>
              <div className="bg-bg border border-line p-2">
                <div className="font-mono text-micro text-ink-3 mb-1">GAP</div>
                <div className="font-mono font-bold text-base" style={{ color: '#c0272d' }}>
                  {shippingPlacebo.gap.toFixed(1)}pp
                </div>
                <div className="font-mono text-micro text-ink-3 mt-0.5">Hormuz − Ctrl</div>
              </div>
            </div>

            <p>
              <span className="text-ink font-semibold">Design:</span> Non-Hormuz tankers on
              Atlantic and Pacific routes serve as a within-sector control. Same war, same
              industry, same freight cycle — differing only in route exposure. This is the
              cleanest identification idea in the project.
            </p>
            <p>
              <span className="text-refuted font-semibold">Why it fails:</span> an exact
              permutation test over all C(6,2)&nbsp;=&nbsp;15 ways of splitting six tankers into a
              2/4 treated-control split ranks the observed{' '}
              <span className="font-semibold text-ink">{shippingPlacebo.gap.toFixed(1)}pp</span> gap{' '}
              <span className="font-semibold text-ink">second</span>, one-sided p ={' '}
              {shippingPlacebo.pPermutation}. With six tankers the smallest attainable p-value is{' '}
              {shippingPlacebo.minAttainableP}, so no effect size could have produced a significant
              result here.
            </p>
            <p className="mt-1 border-t border-line pt-2 text-label text-ink-3">
              A route-specific mechanism remains plausible — insurance premium spikes, seizure risk,
              cargo diversion — but this design cannot demonstrate it, and the market models it
              rests on explain almost none of these stocks' variance. The previously published gap
              of −7.94pp appeared in no notebook output and has been removed.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
