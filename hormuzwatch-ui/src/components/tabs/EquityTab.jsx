import {
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts'
import MetricCard from '../MetricCard.jsx'
import { equitiesCAR } from '../../data/equities.js'
import { equityStats, tickerCAR, shippingPlacebo } from '../../data/metrics.js'

const COLORS = {
  defense         : '#3b82f6',
  energy          : '#e8b84b',
  shipping_hormuz : '#ef4444',
  shipping_ctrl   : '#94a3b8',
}
const GRID = '#2a2a3a'
const TEXT = '#94a3b8'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#1a1a28', border: '1px solid #2a2a3a',
      padding: '8px 12px', fontSize: 11, fontFamily: 'monospace',
    }}>
      <p style={{ color: '#94a3b8', marginBottom: 4 }}>
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
  const lastPoint = equitiesCAR[equitiesCAR.length - 1] || {}

  return (
    <div className="space-y-4">

      {/* Sector metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="DEFENSE SECTOR CAR"
          value={`${equityStats.defense.car.toFixed(1)}%`}
          accent="red"
          description="LMT −14.2% · RTX −5.7% · NOC −10.9%. Sell-the-news dynamics after prior pricing-in of conflict. Low market betas (R²<0.09) confirm decorrelation from SPY."
        />
        <MetricCard
          label="ENERGY SECTOR CAR"
          value={`+${equityStats.energy.car.toFixed(1)}%`}
          accent="gold"
          description="BP +16.4% · CVX −0.2% · XOM −4.7%. Entirely driven by BP's upstream exposure. XOM/CVX underperformed despite Brent +40%, consistent with demand-destruction hedging."
        />
        <MetricCard
          label="HORMUZ SHIPPING CAR"
          value={`${equityStats.shipping_hormuz.car.toFixed(1)}%`}
          accent="red"
          description="FRO −13.4% · STNG −11.3%. Hormuz-exposed tankers sold off sharply — insurance premium spikes and seizure risk outweighed freight-rate upside."
        />
        <MetricCard
          label="SHIPPING PLACEBO GAP"
          value={`${shippingPlacebo.gap.toFixed(1)}pp`}
          accent="muted"
          description={`Hormuz basket (${shippingPlacebo.hormuzCAR.toFixed(1)}%) vs non-Hormuz control (${shippingPlacebo.nonHormuzCAR.toFixed(1)}%). Route-exposure placebo confirms ${shippingPlacebo.gap.toFixed(1)}pp underperformance is Hormuz-specific, not sector-wide.`}
        />
      </div>

      {/* CAR chart */}
      <div className="bg-hw-card border border-hw-border p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] tracking-[0.2em] text-hw-muted">
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
                <span className="font-mono text-[10px] text-hw-muted">{label}</span>
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
                stroke="#e8b84b"
                strokeDasharray="4 4"
                strokeOpacity={0.8}
                label={{
                  value: 'STRIKE', position: 'top',
                  fill: '#e8b84b', fontSize: 9, fontFamily: 'monospace',
                }}
              />
              <Line type="monotone" dataKey="defense"         stroke={COLORS.defense}         strokeWidth={2} dot={false} name="Defense" />
              <Line type="monotone" dataKey="energy"           stroke={COLORS.energy}           strokeWidth={2} dot={false} name="Energy" />
              <Line type="monotone" dataKey="shipping_hormuz"  stroke={COLORS.shipping_hormuz}  strokeWidth={2} dot={false} name="Shipping (Hormuz)" />
              <Line type="monotone" dataKey="shipping_ctrl"    stroke={COLORS.shipping_ctrl}    strokeWidth={2} dot={false} name="Shipping (Ctrl)" strokeDasharray="4 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <p className="text-hw-muted text-xs font-inter mt-2">
          CAR normalized to 0 at t=−1. Estimation window: Nov 2025 – Feb 27, 2026. SPY used as market factor.
          Pre-period R² values 0.001–0.082 indicate decorrelation — abnormal returns capture genuine idiosyncratic responses.
        </p>
      </div>

      {/* Individual ticker table + shipping paradox */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Ticker CARs */}
        <div className="bg-hw-card border border-hw-border p-4">
          <div className="font-mono text-[10px] tracking-[0.2em] text-hw-muted mb-3">
            INDIVIDUAL TICKER CAR (FULL POST-PERIOD)
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-hw-border">
                {['TICKER', 'SECTOR', 'CAR'].map(h => (
                  <th key={h} className="text-left py-1.5 font-mono text-[10px] text-hw-muted tracking-wider">
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
                <tr key={row.t} className="border-b border-hw-border last:border-0">
                  <td className="py-2 font-mono font-semibold text-hw-text text-sm">{row.t}</td>
                  <td className="py-2 font-mono text-xs text-hw-muted">{row.s}</td>
                  <td className="py-2 font-mono font-semibold text-sm" style={{
                    color: row.c >= 0 ? '#10b981' : '#ef4444'
                  }}>
                    {row.c >= 0 ? '+' : ''}{row.c.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Route-exposure placebo test */}
        <div className="bg-hw-card border border-hw-border p-4">
          <div className="font-mono text-[10px] tracking-[0.2em] text-hw-muted mb-3">
            ROUTE-EXPOSURE PLACEBO TEST
          </div>
          <div className="space-y-3 text-hw-sub text-sm font-inter leading-relaxed">

            {/* Gap summary */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-hw-bg border border-hw-border p-2">
                <div className="font-mono text-[10px] text-hw-muted mb-1">HORMUZ BASKET</div>
                <div className="font-mono font-bold text-base" style={{ color: '#ef4444' }}>
                  {shippingPlacebo.hormuzCAR.toFixed(1)}%
                </div>
                <div className="font-mono text-[9px] text-hw-muted mt-0.5">FRO · STNG</div>
              </div>
              <div className="bg-hw-bg border border-hw-border p-2">
                <div className="font-mono text-[10px] text-hw-muted mb-1">CTRL BASKET</div>
                <div className="font-mono font-bold text-base" style={{ color: '#94a3b8' }}>
                  {shippingPlacebo.nonHormuzCAR.toFixed(1)}%
                </div>
                <div className="font-mono text-[9px] text-hw-muted mt-0.5">HAFNI · INSW · NAT · TK</div>
              </div>
              <div className="bg-hw-bg border border-hw-border p-2">
                <div className="font-mono text-[10px] text-hw-muted mb-1">GAP</div>
                <div className="font-mono font-bold text-base" style={{ color: '#ef4444' }}>
                  {shippingPlacebo.gap.toFixed(1)}pp
                </div>
                <div className="font-mono text-[9px] text-hw-muted mt-0.5">Hormuz − Ctrl</div>
              </div>
            </div>

            <p>
              <span className="text-hw-gold font-semibold">Design:</span> Non-Hormuz tankers (Atlantic/Pacific routes) serve as a within-sector control.
              If shipping underperformance were sector-wide (e.g., demand recession, oil price spike suppressing consumption),
              both baskets should fall equally.
            </p>
            <p>
              <span className="text-hw-text font-semibold">Result:</span> The <span className="font-semibold" style={{ color: '#ef4444' }}>{shippingPlacebo.gap.toFixed(1)}pp gap</span> is
              route-specific. Hormuz-exposed operators face insurance premium spikes (Hull War Risk),
              Iranian asset-seizure risk, and cargo diversion costs that non-Hormuz routes do not.
            </p>
            <p className="text-hw-muted text-xs border-t border-hw-border pt-2 mt-1">
              Rules out: sector-wide recession hedging, oil-price beta, and SPY correlation as confounders.
              A sustained closure (90+ days) may reverse this if freight-rate premiums exceed insurance costs —
              1984 Tanker War precedent suggests this threshold is ~3 months.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
