import { ExternalLink } from 'lucide-react'
import {
  syntheticControl as staticSC,
  shippingPlacebo as staticShippingPlacebo,
  didResults as staticDidResults,
} from '../../data/metrics.js'
import { useLiveData } from '../../context/LiveDataContext.jsx'

const Section = ({ title, children }) => (
  <div className="bg-hw-card border border-hw-border p-4">
    <div className="font-mono text-[10px] tracking-[0.2em] text-hw-muted mb-3">{title}</div>
    {children}
  </div>
)

export default function MethodologyTab() {
  const { live } = useLiveData() ?? {}
  const sc              = live?.metrics?.syntheticControl  ?? staticSC
  const shippingPlacebo = live?.metrics?.shippingPlacebo   ?? staticShippingPlacebo
  const didResults      = live?.metrics?.didResults        ?? staticDidResults

  return (
    <div className="space-y-4 max-w-4xl">

      {/* Intro */}
      <Section title="HOW WE MEASURED THE IMPACT">
        <p className="text-sm text-hw-sub font-inter leading-relaxed">
          Six independent methods were applied to estimate how much of the oil price surge, shipping losses,
          and food cost increases were caused by the Hormuz conflict — as opposed to unrelated market noise.
          Each method attacks the same question from a different angle. Their convergence strengthens confidence in the findings.
        </p>
      </Section>

      {/* Method 1 — Event Study */}
      <Section title="METHOD 1 — DID STOCKS REACT ABNORMALLY?">
        <p className="text-sm text-hw-sub font-inter leading-relaxed mb-3">
          We first established how each stock normally tracks the S&P 500, using four months of pre-war data.
          Then we measured how much each stock deviated from that baseline in the 30 trading days after Feb 28.
          The excess — above what the market alone would predict — is the "abnormal return."
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { k: 'EVENT DATE',        v: 'Feb 28, 2026' },
            { k: 'BASELINE PERIOD',   v: 'Nov 2025 – Feb 2026 (83 days)' },
            { k: 'TRACKING WINDOW',   v: '5 days before → 30 days after' },
            { k: 'BENCHMARK',         v: 'S&P 500 (SPY); STOXX 600 for EU stocks' },
          ].map(r => (
            <div key={r.k} className="flex flex-col gap-0.5">
              <span className="font-mono text-[10px] text-hw-muted tracking-wider">{r.k}</span>
              <span className="text-xs text-hw-text">{r.v}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Method 2 — Synthetic Control */}
      <Section title="METHOD 2 — WHAT WOULD OIL HAVE COST WITHOUT THE WAR?">
        <p className="text-sm text-hw-sub font-inter leading-relaxed mb-3">
          A synthetic spot Brent counterfactual was built from Dubai crude and FRED WTI, calibrated to
          match Brent's pre-conflict trajectory. A separate futures estimate uses the demeaned Brent–WTI spread. After Feb 28, Brent diverged
          from this counterfactual — that gap is the estimated war premium.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {[
            { k: 'PRE-WAR FIT ERROR',      v: `$${sc.prePeriodRMSE}/bbl`,    color: 'text-hw-text' },
            { k: 'WAR PREMIUM (SPOT)',      v: `+$${sc.spotATT}/bbl`,          color: 'text-hw-gold' },
            { k: 'WAR PREMIUM (FUTURES)',   v: `+$${sc.futuresATT}/bbl`,       color: 'text-hw-gold' },
          ].map(r => (
            <div key={r.k} className="bg-hw-bg border border-hw-border p-3">
              <span className="font-mono text-[10px] text-hw-muted tracking-wider block mb-1">{r.k}</span>
              <span className={`font-mono text-sm font-semibold ${r.color}`}>{r.v}</span>
            </div>
          ))}
        </div>
        <div className="font-mono text-[10px] text-hw-muted tracking-wider mb-2">DONOR WEIGHTS (HOW THE SYNTHETIC WAS BUILT)</div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-hw-border">
              {['COMMODITY', 'WEIGHT', 'BAR'].map(h => (
                <th key={h} className="text-left py-1.5 font-mono text-[10px] text-hw-muted tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sc.donorWeights.map(d => (
              <tr key={d.name} className="border-b border-hw-border last:border-0">
                <td className="py-2 font-inter text-xs text-hw-text">{d.name.split(' (')[0]}</td>
                <td className="py-2 font-mono font-semibold text-sm text-hw-gold">{d.weight.toFixed(1)}%</td>
                <td className="py-2">
                  <div className="bg-hw-border h-1.5 w-full max-w-[120px]">
                    <div className="h-full" style={{ width: `${d.weight}%`, background: '#e8b84b' }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* Method 3 — Shipping Placebo */}
      <Section title="METHOD 3 — DID HORMUZ TANKERS SPECIFICALLY SUFFER MORE?">
        <p className="text-sm text-hw-sub font-inter leading-relaxed mb-3">
          If the conflict created genuine Hormuz-specific risk, tankers routed through that strait should
          have underperformed similar ships on other routes. We compared the two groups — same industry,
          same oil-price exposure, different geography. A broad market shock would have hit both equally.
        </p>
        <div className="flex gap-3">
          <div className="flex-1 bg-hw-bg border border-hw-border p-3 text-center">
            <div className="font-mono text-[10px] text-hw-muted mb-1">HORMUZ TANKERS</div>
            <div className="font-mono text-[9px] text-hw-muted mb-2">FRO, STNG</div>
            <div className="font-mono font-bold text-lg" style={{ color: '#ef4444' }}>
              {shippingPlacebo.hormuzCAR.toFixed(1)}%
            </div>
          </div>
          <div className="flex items-center font-mono text-hw-muted text-sm">vs</div>
          <div className="flex-1 bg-hw-bg border border-hw-border p-3 text-center">
            <div className="font-mono text-[10px] text-hw-muted mb-1">OTHER ROUTES</div>
            <div className="font-mono text-[9px] text-hw-muted mb-2">HAFNI, INSW, NAT, TK</div>
            <div className="font-mono font-bold text-lg" style={{ color: '#94a3b8' }}>
              {shippingPlacebo.nonHormuzCAR.toFixed(1)}%
            </div>
          </div>
          <div className="flex items-center font-mono text-hw-muted text-sm">=</div>
          <div className="flex-1 bg-hw-bg border border-[#ef444455] p-3 text-center">
            <div className="font-mono text-[10px] text-hw-muted mb-1">HORMUZ-SPECIFIC GAP</div>
            <div className="font-mono font-bold text-lg" style={{ color: '#ef4444' }}>
              {shippingPlacebo.gap.toFixed(1)}pp
            </div>
          </div>
        </div>
      </Section>

      {/* Method 4 — DiD */}
      <Section title="METHOD 4 — HOW MUCH DID OIL RISE ABOVE OTHER ENERGY?">
        <p className="text-sm text-hw-sub font-inter leading-relaxed mb-3">
          Oil (Brent + WTI) was compared against energy sources that don't route through Hormuz — natural gas
          and coal. If both had risen together, we'd attribute it to a general energy shock. The extra rise
          in oil specifically is the Hormuz war premium. Two sub-periods isolate the strike phase from the
          strait closure.
        </p>
        <div className="flex gap-3 mb-4">
          {[
            { label: 'STRIKE ONLY',     sub: 'Mar 2–6 (5 days)',     val: `+$${didResults.p1Strike.dolBbl.toFixed(2)}/bbl`, color: '#e8b84b' },
            { label: 'HORMUZ CLOSURE',  sub: 'Mar 9–Jun 18',         val: `+$${didResults.p2Hormuz.dolBbl.toFixed(2)}/bbl`, color: '#ef4444' },
            { label: 'FULL PERIOD',     sub: 'Through reopening',    val: `+$${didResults.fullPost.dolBbl.toFixed(2)}/bbl`, color: '#10b981' },
          ].map(r => (
            <div key={r.label} className="flex-1 bg-hw-bg border border-hw-border p-3 text-center">
              <div className="font-mono text-[10px] text-hw-muted mb-1">{r.label}</div>
              <div className="font-mono font-bold text-lg" style={{ color: r.color }}>{r.val}</div>
              <div className="font-mono text-[9px] text-hw-muted mt-0.5">{r.sub}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-3 p-3 bg-hw-bg border border-hw-border">
          <div className="w-1 flex-shrink-0" style={{ background: '#e8b84b' }} />
          <div>
            <div className="font-mono text-xs font-semibold text-hw-gold mb-1">THREE METHODS, SAME ANSWER</div>
            <div className="font-mono text-[10px] text-hw-sub leading-loose">
              Synthetic control (futures): <span className="text-hw-text">+${sc.futuresATT}/bbl</span> ·{' '}
              Synthetic control (spot): <span className="text-hw-text">+${sc.spotATT}/bbl</span> ·{' '}
              Diff-in-diff: <span className="text-hw-text">+${didResults?.fullPost?.dolBbl?.toFixed(2) ?? '—'}/bbl</span>
            </div>
          </div>
        </div>
      </Section>

      {/* Caveats */}
      <Section title="KNOWN LIMITATIONS">
        <div className="space-y-3">
          {[
            {
              label: 'Dubai crude data is frozen at Feb 2026',
              text: 'Dubai price data (monthly, IMF) ends February 2026. In the post-war period this price is held constant, which inflates the spot synthetic control estimate. The futures estimate and the DiD result are unaffected and more reliable.',
              severity: 'warn',
            },
            {
              label: 'Defense and oil stocks moved independently of the S&P 500',
              text: 'During our baseline period, these stocks had very low correlation with the broader market. That confirms the CARs capture genuine conflict-driven moves — but it also means the model removes less background noise, widening uncertainty bands.',
              severity: 'info',
            },
            {
              label: 'Only one oil futures donor was available',
              text: 'The futures synthetic control uses only WTI as a reference, so the result is essentially a Brent-WTI spread change rather than a full counterfactual. Directionally meaningful, but narrower than the DiD estimate.',
              severity: 'info',
            },
          ].map(c => (
            <div key={c.label} className="flex gap-3 p-3 bg-hw-bg border border-hw-border">
              <div className="w-1 flex-shrink-0" style={{ background: c.severity === 'warn' ? '#ef4444' : '#3b82f6' }} />
              <div>
                <div className="font-mono text-xs font-semibold mb-1"
                     style={{ color: c.severity === 'warn' ? '#ef4444' : '#3b82f6' }}>
                  {c.label.toUpperCase()}
                </div>
                <p className="text-hw-sub text-xs font-inter leading-relaxed">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Data sources */}
      <Section title="DATA SOURCES AND REPLICATION">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
          {[
            { source: 'Yahoo Finance (yfinance)',  series: 'BZ=F, CL=F, LMT, RTX, NOC, XOM, CVX, BP, FRO, STNG, SPY' },
            { source: 'FRED (EIA)',                series: 'DCOILBRENTEU, DCOILWTICO' },
            { source: 'FRED (EIA)',                series: 'DHHNGSP (Henry Hub natural gas)' },
            { source: 'FRED (IMF)',                series: 'POILDUBUSDM (Dubai crude, monthly)' },
          ].map(d => (
            <div key={d.source + d.series} className="bg-hw-bg p-2.5 border border-hw-border">
              <div className="font-mono text-[10px] text-hw-muted mb-0.5">{d.source}</div>
              <div className="font-mono text-xs text-hw-gold">{d.series}</div>
            </div>
          ))}
        </div>
        <a
          href="https://github.com/Aman12x/hormuzwatch"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 font-mono text-xs text-hw-blue hover:text-blue-400 transition-colors border border-hw-border px-3 py-2 hover:border-blue-500"
        >
          <ExternalLink size={12} />
          github.com/Aman12x/hormuzwatch — Full notebooks, pipelines, data
        </a>
        <p className="text-hw-muted text-[10px] font-mono mt-3">
          METHOD REFS: Abadie, Diamond &amp; Hainmueller (2010) · Brown, Warner (1985) event study
        </p>
      </Section>

    </div>
  )
}
