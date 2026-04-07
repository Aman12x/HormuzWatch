import { ExternalLink } from 'lucide-react'
import { syntheticControl, shippingPlacebo, didResults } from '../../data/metrics.js'

const Section = ({ title, children }) => (
  <div className="bg-hw-card border border-hw-border p-4">
    <div className="font-mono text-[10px] tracking-[0.2em] text-hw-muted mb-3">{title}</div>
    {children}
  </div>
)

const Code = ({ children }) => (
  <span className="font-mono text-hw-gold bg-hw-bg px-1.5 py-0.5 text-xs">{children}</span>
)

export default function MethodologyTab() {
  return (
    <div className="space-y-4 max-w-4xl">

      {/* Event Study */}
      <Section title="EVENT STUDY — MARKET MODEL OLS">
        <div className="space-y-2 text-hw-sub text-sm font-inter leading-relaxed">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            {[
              { k: 'EVENT DATE',        v: '2026-02-28 (T1 → first trading day 2026-03-02)' },
              { k: 'ESTIMATION WINDOW', v: '2025-11-01 → 2026-02-27 (83 trading days)'       },
              { k: 'EVENT WINDOW',      v: 't=−5 to t=+30 relative to event date'            },
              { k: 'MARKET FACTOR',     v: 'SPY (S&P 500 ETF) — daily log returns'           },
            ].map(r => (
              <div key={r.k} className="flex flex-col gap-0.5">
                <span className="font-mono text-[10px] text-hw-muted tracking-wider">{r.k}</span>
                <span className="text-xs text-hw-text">{r.v}</span>
              </div>
            ))}
          </div>
          <p>
            For each ticker, we estimate <Code>Rᵢ = αᵢ + βᵢ·R_SPY + εᵢ</Code> on the estimation
            window via OLS. Abnormal returns <Code>ARᵢₜ = Rᵢₜ − (αᵢ + βᵢ·R_SPY,t)</Code> are
            computed in the event window. Cumulative abnormal returns
            <Code>CARᵢ = Σ ARᵢₜ</Code> are sector-averaged.
          </p>
          <p className="text-hw-muted text-xs">
            All market-model R² values fall between 0.001–0.082, indicating these
            stocks moved largely independently of SPY during the estimation window —
            suggesting prior conflict pricing-in was already reshaping cross-asset
            correlations before the Feb 28 event date.
          </p>
        </div>
      </Section>

      {/* Synthetic Control */}
      <Section title="SYNTHETIC CONTROL — DONOR WEIGHTS AND FIT">
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { k: 'TREATED UNIT',       v: 'FRED Brent (DCOILBRENTEU, EIA daily spot)' },
              { k: 'OPTIMIZATION',       v: 'SLSQP — convex weights (Σwᵢ=1, wᵢ≥0)'    },
              { k: 'PRE-PERIOD RMSE',    v: `$${syntheticControl.prePeriodRMSE}/bbl`    },
              { k: 'POST-PERIOD ATT',    v: `+$${syntheticControl.spotATT}/bbl (spot)`  },
            ].map(r => (
              <div key={r.k} className="flex flex-col gap-0.5">
                <span className="font-mono text-[10px] text-hw-muted tracking-wider">{r.k}</span>
                <span className="text-xs text-hw-text">{r.v}</span>
              </div>
            ))}
          </div>

          {/* Donor weights table */}
          <div>
            <div className="font-mono text-[10px] text-hw-muted tracking-wider mb-2">ORIGINAL DONOR WEIGHTS (3-DONOR SC)</div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-hw-border">
                  {['DONOR', 'SERIES ID', 'WEIGHT', 'BAR'].map(h => (
                    <th key={h} className="text-left py-1.5 font-mono text-[10px] text-hw-muted tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {syntheticControl.donorWeights.map(d => (
                  <tr key={d.name} className="border-b border-hw-border last:border-0">
                    <td className="py-2 font-inter text-xs text-hw-text">{d.name.split(' (')[0]}</td>
                    <td className="py-2 font-mono text-[10px] text-hw-muted">
                      {d.name.match(/\(([^)]+)\)/)?.[1] || ''}
                    </td>
                    <td className="py-2 font-mono font-semibold text-sm text-hw-gold">{d.weight.toFixed(1)}%</td>
                    <td className="py-2">
                      <div className="bg-hw-border h-1.5 w-full max-w-[120px]">
                        <div
                          className="h-full"
                          style={{ width: `${d.weight}%`, background: '#e8b84b' }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* Route Exposure Placebo Test */}
      <Section title="ROUTE EXPOSURE PLACEBO TEST">
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { k: 'TREATED BASKET',  v: 'FRO, STNG — Hormuz-exposed VLCCs/product tankers' },
              { k: 'CONTROL BASKET',  v: 'HAFNI (Oslo), INSW, NAT, TK — Atlantic/Pacific diversified routes' },
              { k: 'IDENTIFICATION',  v: 'Within-sector route-exposure comparison (same asset class, different geography)' },
              { k: 'RESULT',          v: `Hormuz basket ${shippingPlacebo.hormuzCAR.toFixed(1)}% vs Ctrl ${shippingPlacebo.nonHormuzCAR.toFixed(1)}% → gap ${shippingPlacebo.gap.toFixed(1)}pp` },
            ].map(r => (
              <div key={r.k} className="flex flex-col gap-0.5">
                <span className="font-mono text-[10px] text-hw-muted tracking-wider">{r.k}</span>
                <span className="text-xs text-hw-text">{r.v}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2 text-hw-sub text-sm font-inter leading-relaxed">
            <p>
              Shipping stocks that route through the Strait of Hormuz (<Code>FRO</Code>, <Code>STNG</Code>) are compared
              against a control basket of tankers on non-Hormuz routes (<Code>HAFNI</Code>, <Code>INSW</Code>, <Code>NAT</Code>, <Code>TK</Code>).
              Both groups share the same asset class, leverage profile, and oil-price sensitivity — the only
              material difference is route exposure.
            </p>
            <p>
              A uniform sector-wide shock (e.g., recession fears, oil demand destruction) would depress both
              baskets equally. The observed <span className="text-hw-text font-semibold">{shippingPlacebo.gap.toFixed(1)}pp differential</span> attributable
              to the Hormuz-exposed basket rules out these confounders and identifies route-specific pricing:
              Hull War Risk insurance premium spikes and Iranian seizure risk.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="flex-1 bg-hw-bg border border-hw-border p-3 text-center">
              <div className="font-mono text-[10px] text-hw-muted mb-1">HORMUZ (FRO+STNG)</div>
              <div className="font-mono font-bold text-lg" style={{ color: '#ef4444' }}>
                {shippingPlacebo.hormuzCAR.toFixed(1)}%
              </div>
            </div>
            <div className="flex items-center font-mono text-hw-muted text-sm">−</div>
            <div className="flex-1 bg-hw-bg border border-hw-border p-3 text-center">
              <div className="font-mono text-[10px] text-hw-muted mb-1">CTRL (HAFNI+INSW+NAT+TK)</div>
              <div className="font-mono font-bold text-lg" style={{ color: '#94a3b8' }}>
                {shippingPlacebo.nonHormuzCAR.toFixed(1)}%
              </div>
            </div>
            <div className="flex items-center font-mono text-hw-muted text-sm">=</div>
            <div className="flex-1 bg-hw-bg border border-[#ef444455] p-3 text-center">
              <div className="font-mono text-[10px] text-hw-muted mb-1">PLACEBO GAP</div>
              <div className="font-mono font-bold text-lg" style={{ color: '#ef4444' }}>
                {shippingPlacebo.gap.toFixed(1)}pp
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Oil DiD: vs Non-Hormuz Energy */}
      <Section title="DIFFERENCE-IN-DIFFERENCES — OIL vs NON-HORMUZ ENERGY CONTROL">
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { k: 'TREATED UNITS',  v: 'Brent Crude (FRED) + WTI (CL=F) — Hormuz-exposed oil' },
              { k: 'CONTROL UNITS',  v: 'Henry Hub Nat Gas (NG=F) + Coal Sector ETF (COAL) — non-Hormuz energy' },
              { k: 'IDENTIFICATION', v: 'Parallel trends assumption: in absence of treatment, oil would have tracked non-Hormuz energy' },
              { k: 'PRE-TREND TEST', v: 'β(treated×time) = 0.160, p = 0.466 — parallel trends hold (p > 0.10)' },
            ].map(r => (
              <div key={r.k} className="flex flex-col gap-0.5">
                <span className="font-mono text-[10px] text-hw-muted tracking-wider">{r.k}</span>
                <span className="text-xs text-hw-text">{r.v}</span>
              </div>
            ))}
          </div>

          {/* Three-period results */}
          <div className="flex gap-3">
            {[
              { label: 'STRIKE ONLY',      sub: 'Mar 2–6 (5d)',    coef: didResults.p1Strike.coef,  dol: didResults.p1Strike.dolBbl,  p: didResults.p1Strike.p,  color: '#e8b84b' },
              { label: 'HORMUZ CLOSURE',   sub: 'Mar 9+ (19d)',    coef: didResults.p2Hormuz.coef,  dol: didResults.p2Hormuz.dolBbl,  p: didResults.p2Hormuz.p,  color: '#ef4444' },
              { label: 'FULL POST-EVENT',  sub: '24 trading days', coef: didResults.fullPost.coef,  dol: didResults.fullPost.dolBbl,  p: didResults.fullPost.p,  color: '#10b981' },
            ].map(r => (
              <div key={r.label} className="flex-1 bg-hw-bg border border-hw-border p-3 text-center">
                <div className="font-mono text-[10px] text-hw-muted mb-1">{r.label}</div>
                <div className="font-mono font-bold text-lg" style={{ color: r.color }}>
                  +${r.dol.toFixed(2)}/bbl
                </div>
                <div className="font-mono text-[9px] text-hw-muted mt-0.5">
                  +{r.coef.toFixed(1)} idx pts · p={r.p.toFixed(4)}
                </div>
                <div className="font-mono text-[9px] text-hw-muted">{r.sub}</div>
              </div>
            ))}
          </div>

          <div className="space-y-2 text-hw-sub text-sm font-inter leading-relaxed">
            <p>
              The full post-event DiD estimate of <span className="text-hw-gold font-semibold">+${didResults.fullPost.dolBbl.toFixed(2)}/bbl</span> (t={didResults.fullPost.t.toFixed(2)}, p&lt;0.001)
              cross-validates the synthetic control spot ATT of <span className="text-hw-gold font-semibold">+$35.99/bbl</span> from
              notebook 02 — two independent identification strategies converging on the same
              ~$35–40/bbl Hormuz war premium. The two-period decomposition isolates the{' '}
              <span className="text-hw-text font-semibold">Hormuz closure increment of +${didResults.hormuzIncrement.toFixed(2)}/bbl</span>:
              the additional premium of switching from geopolitical conflict risk to actual
              physical supply disruption.
            </p>
          </div>

          <div className="flex gap-3 p-3 bg-hw-bg border border-hw-border">
            <div className="w-1 flex-shrink-0" style={{ background: '#e8b84b' }} />
            <div>
              <div className="font-mono text-xs font-semibold text-hw-gold mb-1">
                CROSS-NOTEBOOK CONVERGENCE
              </div>
              <div className="font-mono text-[10px] text-hw-sub leading-loose">
                SC futures ATT (NB 02): <span className="text-hw-text">+$3.51/bbl</span> (paper market war premium) ·
                SC spot ATT (NB 02): <span className="text-hw-text">+$35.99/bbl</span> ·
                DiD full post (NB 05): <span className="text-hw-text">+$39.40/bbl</span> ·
                DiD Hormuz period (NB 05): <span className="text-hw-text">+$43.05/bbl</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 p-3 bg-hw-bg border border-hw-border">
            <div className="w-1 flex-shrink-0" style={{ background: '#3b82f6' }} />
            <div>
              <div className="font-mono text-xs font-semibold mb-1" style={{ color: '#3b82f6' }}>
                CLUSTER CAVEAT — N=4 ENTITIES
              </div>
              <p className="text-hw-sub text-xs font-inter leading-relaxed">
                Entity-level clustering with N=4 commodities produces imprecise variance estimates
                (Cameron-Miller few-cluster problem). HC3 cross-check gives SE=3.89 vs clustered SE=15.08 —
                the clustered SE is conservative here. Both give p&lt;0.001, so significance
                is not sensitive to the SE choice. Coal ETF (COAL) introduces equity market beta
                into the control; spot coal futures (MTF=F) were delisted Dec 2025.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* Honest caveats */}
      <Section title="CAVEATS AND LIMITATIONS">
        <div className="space-y-3">
          {[
            {
              label: 'Dubai data lag',
              text:  'POILDUBUSDM (Dubai crude, IMF) is monthly and ends Feb 2026. ' +
                     'The all-spot synthetic forward-fills from $68.51 in the post-period, ' +
                     'causing the spot ATT ($35.99/bbl) to reflect "price above last-known Dubai" ' +
                     'rather than a clean war premium. The futures ATT ($3.51/bbl) is unaffected and cleaner.',
              severity: 'warn',
            },
            {
              label: 'Low R² market models',
              text:  'All OLS betas have R² < 0.09, indicating the stocks were decorrelated from SPY. ' +
                     'This validates that the CARs capture genuine idiosyncratic responses but also means ' +
                     'the market model doesn\'t remove much noise — widening confidence intervals.',
              severity: 'info',
            },
            {
              label: 'Narrow futures donor pool',
              text:  'The all-futures SC uses only CL=F as a donor (weight forced to 1.0). ' +
                     'The pre-period RMSE is the raw Brent-WTI spread ($4.32/bbl). ' +
                     'The ATT represents the change in this spread post-treatment — economically meaningful ' +
                     'but not a pure synthetic control estimate.',
              severity: 'info',
            },
          ].map(c => (
            <div key={c.label} className="flex gap-3 p-3 bg-hw-bg border border-hw-border">
              <div
                className="w-1 flex-shrink-0"
                style={{ background: c.severity === 'warn' ? '#ef4444' : '#3b82f6' }}
              />
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

      {/* Data sources + link */}
      <Section title="DATA SOURCES AND REPLICATION">
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { source: 'Yahoo Finance (yfinance)',    series: 'BZ=F, CL=F, LMT, RTX, NOC, XOM, CVX, BP, FRO, STNG, SPY' },
              { source: 'FRED (EIA)',                  series: 'DCOILBRENTEU, DCOILWTICO' },
              { source: 'FRED (EIA)',                  series: 'DHHNGSP (Henry Hub natural gas)' },
              { source: 'FRED (IMF)',                  series: 'POILDUBUSDM (Dubai crude, monthly)' },
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
          <p className="text-hw-muted text-[10px] font-mono">
            METHOD REFS: Abadie, Diamond &amp; Hainmueller (2010) · Brown, Warner (1985) event study
          </p>
        </div>
      </Section>
    </div>
  )
}
