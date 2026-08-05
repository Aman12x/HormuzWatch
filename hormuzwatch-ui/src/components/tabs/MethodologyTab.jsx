import { ExternalLink } from 'lucide-react'
import {
  syntheticControl as staticSC,
  shippingPlacebo as staticShippingPlacebo,
  didResults as staticDidResults,
  ovxPlacebo,
} from '../../data/metrics.js'

const Section = ({ title, status, children }) => (
  <div className="bg-hw-card border border-hw-border p-4">
    <div className="flex flex-wrap items-center gap-3 mb-3">
      <span className="font-mono text-[10px] tracking-[0.2em] text-hw-muted">{title}</span>
      {status && <StatusBadge kind={status} />}
    </div>
    {children}
  </div>
)

const STATUS = {
  reported: { label: 'REPORTED', color: '#a6e3a1', border: '#a6e3a155', bg: '#a6e3a111' },
  exploratory: { label: 'EXPLORATORY — NOT REPORTED', color: '#e8b84b', border: '#e8b84b55', bg: '#e8b84b11' },
  failed: { label: 'FAILED ITS OWN PLACEBO', color: '#ef4444', border: '#ef444455', bg: '#ef444411' },
}

const StatusBadge = ({ kind }) => {
  const s = STATUS[kind]
  return (
    <span
      className="font-mono text-[9px] tracking-[0.14em] px-2 py-1 border"
      style={{ color: s.color, borderColor: s.border, background: s.bg }}
    >
      {s.label}
    </span>
  )
}

const Note = ({ tone = 'warn', title, children }) => (
  <div className="flex gap-3 p-3 bg-hw-bg border border-hw-border mt-3">
    <div className="w-1 flex-shrink-0" style={{ background: tone === 'warn' ? '#ef4444' : '#3b82f6' }} />
    <div>
      <div
        className="font-mono text-xs font-semibold mb-1"
        style={{ color: tone === 'warn' ? '#ef4444' : '#3b82f6' }}
      >
        {title}
      </div>
      <p className="text-hw-sub text-xs font-inter leading-relaxed">{children}</p>
    </div>
  </div>
)

export default function MethodologyTab() {
  const sc = staticSC
  const shippingPlacebo = staticShippingPlacebo
  const didResults = staticDidResults

  return (
    <div className="space-y-4 max-w-4xl">

      {/* Intro */}
      <Section title="WHAT THIS PROJECT FOUND, AND WHAT IT DID NOT">
        <p className="text-sm text-hw-sub font-inter leading-relaxed">
          Ten analyses were run on this event. After an inference review, <span className="text-hw-text font-semibold">one</span>{' '}
          survived. The original framing of this project claimed convergent evidence from six
          independent methods; that claim does not hold, and the reasoning is set out at the bottom
          of this page. Everything below is labelled with its actual status. Exploratory sections are
          kept because falsifying your own work is part of the record — they are not results.
        </p>
      </Section>

      {/* Reported finding */}
      <Section title="REPORTED — WAS OIL VOLATILITY UNUSUAL BY HISTORICAL STANDARDS?" status="reported">
        <p className="text-sm text-hw-sub font-inter leading-relaxed mb-3">
          Oil-implied volatility (OVX) was regressed on equity-implied volatility (VIX) in logs,
          fit on {(4731).toLocaleString()} pre-event days so the shock could not bend the line it is
          measured against. The question is not whether a coefficient differs from zero — with
          near-integrated residuals no asymptotic p-value is trustworthy. Instead the closure
          window's mean deviation is compared against{' '}
          <span className="text-hw-text">every other 77-day window since OVX began in 2007</span>.
          The null distribution is built from real data, so it carries the real persistence and
          assumes nothing about the error process.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { k: 'OBSERVED PREMIUM', v: `+${ovxPlacebo.premiumLog.toFixed(3)} log pts`, c: 'text-hw-gold' },
            { k: 'WINDOWS MORE EXTREME', v: `${ovxPlacebo.exceedances} of ${ovxPlacebo.nNullWindows.toLocaleString()}`, c: 'text-hw-gold' },
            { k: 'CONSERVATIVE p', v: `${ovxPlacebo.pNonOverlapping}`, c: 'text-hw-text' },
            { k: 'FIT R²', v: `${ovxPlacebo.fitR2}`, c: 'text-hw-text' },
          ].map(r => (
            <div key={r.k} className="bg-hw-bg border border-hw-border p-3">
              <span className="font-mono text-[10px] text-hw-muted tracking-wider block mb-1">{r.k}</span>
              <span className={`font-mono text-sm font-semibold ${r.c}`}>{r.v}</span>
            </div>
          ))}
        </div>
        <Note tone="info" title="WHAT THIS DOES NOT SHOW">
          {ovxPlacebo.caveat} The conservative p of {ovxPlacebo.pNonOverlapping} is the floor this
          design can resolve — with 61 independent windows, zero exceedances is the most extreme
          result obtainable. Nearest historical rival: {ovxPlacebo.nearestRival}.
        </Note>
      </Section>

      {/* Method — Event Study */}
      <Section title="EXPLORATORY — DID STOCKS REACT ABNORMALLY?" status="exploratory">
        <p className="text-sm text-hw-sub font-inter leading-relaxed mb-3">
          Each stock's normal relationship to the S&P 500 was estimated on four months of pre-war
          data, then post-event deviations from that baseline were accumulated over 30 trading days.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { k: 'EVENT DATE', v: 'Feb 28, 2026' },
            { k: 'BASELINE PERIOD', v: 'Nov 2025 – Feb 2026 (83 days)' },
            { k: 'TRACKING WINDOW', v: '5 days before → 30 days after' },
            { k: 'BENCHMARK', v: 'S&P 500 (SPY); STOXX 600 for EU stocks' },
          ].map(r => (
            <div key={r.k} className="flex flex-col gap-0.5">
              <span className="font-mono text-[10px] text-hw-muted tracking-wider">{r.k}</span>
              <span className="text-xs text-hw-text">{r.v}</span>
            </div>
          ))}
        </div>
        <Note title="WHY THIS IS NOT REPORTED">
          The market models have almost no explanatory power — R² runs 0.000–0.022 across the tanker
          basket, and roughly 0.000 for defense against SPY — so the "abnormal" returns are close to
          raw returns. No standard errors or test statistics were computed on any CAR. The EU
          benchmark and FX series were fetched live and never persisted, so the dual-benchmark
          defense result cannot be reproduced from this repository at all.
        </Note>
      </Section>

      {/* Method — Synthetic Control */}
      <Section title="EXPLORATORY — WHAT WOULD OIL HAVE COST WITHOUT THE WAR?" status="failed">
        <p className="text-sm text-hw-sub font-inter leading-relaxed mb-3">
          A synthetic Brent counterfactual was built from Dubai crude and FRED WTI, with a separate
          futures estimate from the demeaned Brent–WTI spread.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {[
            { k: 'PRE-WAR FIT ERROR', v: `$${sc.prePeriodRMSE}/bbl` },
            { k: 'SPOT ESTIMATE', v: `+$${sc.spotATT}/bbl` },
            { k: 'FUTURES ESTIMATE', v: `+$${sc.futuresATT}/bbl` },
          ].map(r => (
            <div key={r.k} className="bg-hw-bg border border-hw-border p-3">
              <span className="font-mono text-[10px] text-hw-muted tracking-wider block mb-1">{r.k}</span>
              <span className="font-mono text-sm font-semibold text-hw-muted line-through">{r.v}</span>
            </div>
          ))}
        </div>
        <div className="font-mono text-[10px] text-hw-muted tracking-wider mb-2">
          DONOR WEIGHTS (HOW THE SYNTHETIC WAS BUILT)
        </div>
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
                <td className="py-2 font-mono font-semibold text-sm text-hw-muted">{d.weight.toFixed(1)}%</td>
                <td className="py-2">
                  <div className="bg-hw-border h-1.5 w-full max-w-[120px]">
                    <div className="h-full" style={{ width: `${d.weight}%`, background: '#585b70' }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Note title="THIS METHOD FALSIFIED ITSELF">
          The primary specification returned a <span className="text-hw-text font-semibold">negative</span>{' '}
          estimate of −$3.77/bbl against a WTI placebo of −$2.99/bbl — a ratio of 1.3×, and the
          notebook's own decision rule printed the warning. Its donor pool put 77.1% weight on Brent
          spot while the treated unit was Brent futures, so the "synthetic Brent" was mostly Brent.
          The specification shown above, which replaced it, has no placebo test at all, and 20.2% of
          its counterfactual is a Dubai series whose last observation predates treatment and is held
          flat — a counterfactual that is constant by construction. The futures figure is not a
          synthetic control: with one donor the convexity constraint pins the weight to 1.0, making
          it the demeaned Brent–WTI spread.
        </Note>
      </Section>

      {/* Method — Shipping Placebo */}
      <Section title="EXPLORATORY — DID HORMUZ TANKERS SPECIFICALLY SUFFER MORE?" status="exploratory">
        <p className="text-sm text-hw-sub font-inter leading-relaxed mb-3">
          The best identification idea in this project: tankers routed through the strait versus
          similar ships on other routes — same industry, same oil-price exposure, same war, differing
          only in geography.
        </p>
        <div className="flex gap-3">
          <div className="flex-1 bg-hw-bg border border-hw-border p-3 text-center">
            <div className="font-mono text-[10px] text-hw-muted mb-1">HORMUZ TANKERS</div>
            <div className="font-mono text-[9px] text-hw-muted mb-2">FRO, STNG</div>
            <div className="font-mono font-bold text-lg text-hw-sub">
              {shippingPlacebo.hormuzCAR.toFixed(1)}%
            </div>
          </div>
          <div className="flex items-center font-mono text-hw-muted text-sm">vs</div>
          <div className="flex-1 bg-hw-bg border border-hw-border p-3 text-center">
            <div className="font-mono text-[10px] text-hw-muted mb-1">OTHER ROUTES</div>
            <div className="font-mono text-[9px] text-hw-muted mb-2">HAFNI, INSW, NAT, TK</div>
            <div className="font-mono font-bold text-lg text-hw-sub">
              {shippingPlacebo.nonHormuzCAR.toFixed(1)}%
            </div>
          </div>
          <div className="flex items-center font-mono text-hw-muted text-sm">=</div>
          <div className="flex-1 bg-hw-bg border border-hw-border p-3 text-center">
            <div className="font-mono text-[10px] text-hw-muted mb-1">GAP (p = {shippingPlacebo.pPermutation})</div>
            <div className="font-mono font-bold text-lg text-hw-sub">
              {shippingPlacebo.gap.toFixed(1)}pp
            </div>
          </div>
        </div>
        <Note title="THE DESIGN CANNOT REACH SIGNIFICANCE">
          An exact permutation test over all C(6,2) = 15 ways of splitting six tankers into a 2/4
          treated/control split ranks the observed gap{' '}
          <span className="text-hw-text font-semibold">second</span>, one-sided p ={' '}
          {shippingPlacebo.pPermutation}. With six tankers the smallest attainable p-value is{' '}
          {shippingPlacebo.minAttainableP}, so no effect size could have produced a 5% result here.
          The previously published gap of −7.94pp appeared in no notebook output and has been
          removed; the reproducible value is {shippingPlacebo.gap.toFixed(2)}pp.
        </Note>
      </Section>

      {/* Method — DiD */}
      <Section title="EXPLORATORY — HOW MUCH DID OIL RISE ABOVE OTHER ENERGY?" status="exploratory">
        <p className="text-sm text-hw-sub font-inter leading-relaxed mb-3">
          Oil (Brent + WTI) compared against energy that does not route through Hormuz — Henry Hub
          natural gas and a coal ETF — with two sub-periods separating the strike phase from the
          closure.
        </p>
        <div className="flex gap-3">
          {[
            { label: 'STRIKE ONLY', sub: 'Mar 2–6 (5 days)', val: `+$${didResults.p1Strike.dolBbl.toFixed(2)}/bbl` },
            { label: 'HORMUZ CLOSURE', sub: 'Mar 9–Jun 18', val: `+$${didResults.p2Hormuz.dolBbl.toFixed(2)}/bbl` },
            { label: 'FULL PERIOD', sub: 'Through reopening', val: `+$${didResults.fullPost.dolBbl.toFixed(2)}/bbl` },
          ].map(r => (
            <div key={r.label} className="flex-1 bg-hw-bg border border-hw-border p-3 text-center">
              <div className="font-mono text-[10px] text-hw-muted mb-1">{r.label}</div>
              <div className="font-mono font-bold text-lg text-hw-sub">{r.val}</div>
              <div className="font-mono text-[9px] text-hw-muted mt-0.5">{r.sub}</div>
            </div>
          ))}
        </div>
        <Note title="FOUR INDEPENDENT PROBLEMS">
          <span className="text-hw-text">Inference:</span> the panel has four entities.
          Cluster-robust standard errors need roughly 30–50 clusters, and the HC3 "cross-check" is
          worse — it treats 628 autocorrelated daily prices as independent draws. The effective
          sample size is 4, so t = 4.63 carries no information.{' '}
          <span className="text-hw-text">Specification:</span> a non-stationary price level regressed
          on a step dummy with no serial-correlation correction.{' '}
          <span className="text-hw-text">Parallel trends:</span> p = 0.47 is a failure to reject on
          an underpowered test, read as confirmation; note also that the control basket falls from
          107.3 to 96.8, so much of the "premium" is the control declining.{' '}
          <span className="text-hw-text">Timing:</span> treatment is dated to the Feb 28 strikes, not
          the Mar 7 closure, so this is a war premium rather than a chokepoint premium.
        </Note>
      </Section>

      {/* The convergence claim */}
      <Section title="WHY THE 'SIX INDEPENDENT METHODS' CLAIM DOES NOT HOLD">
        <p className="text-sm text-hw-sub font-inter leading-relaxed">
          These analyses run on the same three to six price series. The difference-in-differences and
          the commodity placebo use <span className="text-hw-text">identical</span> treatment and
          control baskets — they are one comparison with two base dates, which is why they disagree
          by a factor of thirty. The basis spread is a subtraction of two other estimates
          (${sc.spotATT} − ${sc.futuresATT}). The futures "synthetic control" is a spread. Convergent
          evidence requires independent identifying variation; one event differenced six ways is the
          same number reported six times.
        </p>
      </Section>

      {/* Data sources */}
      <Section title="DATA SOURCES AND REPLICATION">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
          {[
            { source: 'Yahoo Finance (yfinance)', series: '^OVX, ^VIX, ^GVZ, ^MOVE — reported finding' },
            { source: 'Yahoo Finance (yfinance)', series: 'BZ=F, CL=F, LMT, RTX, NOC, XOM, CVX, BP, FRO, STNG, SPY' },
            { source: 'FRED (EIA)', series: 'DCOILBRENTEU, DCOILWTICO, DHHNGSP' },
            { source: 'FRED (IMF)', series: 'POILDUBUSDM — Dubai crude, monthly; ends before treatment' },
          ].map(d => (
            <div key={d.source + d.series} className="bg-hw-bg p-2.5 border border-hw-border">
              <div className="font-mono text-[10px] text-hw-muted mb-0.5">{d.source}</div>
              <div className="font-mono text-xs text-hw-gold">{d.series}</div>
            </div>
          ))}
        </div>
        <a
          href="https://github.com/Aman12x/HormuzWatch"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 font-mono text-xs text-hw-blue hover:text-blue-400 transition-colors border border-hw-border px-3 py-2 hover:border-blue-500"
        >
          <ExternalLink size={12} />
          github.com/Aman12x/HormuzWatch — notebooks, refit scripts, data
        </a>
        <p className="text-hw-muted text-[10px] font-mono mt-3">
          METHOD REFS: Abadie, Diamond &amp; Hainmueller (2010) in-time placebo · Brown &amp; Warner
          (1985) event study · Bertrand, Duflo &amp; Mullainathan (2004) on serial correlation in DiD
        </p>
      </Section>

    </div>
  )
}
