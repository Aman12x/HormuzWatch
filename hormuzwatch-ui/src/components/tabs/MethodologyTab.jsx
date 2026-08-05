import { ExternalLink } from 'lucide-react'
import { Callout, Panel } from '../ui.jsx'
import {
  syntheticControl as staticSC,
  shippingPlacebo as staticShippingPlacebo,
  didResults as staticDidResults,
  ovxPlacebo,
} from '../../data/metrics.js'

export default function MethodologyTab() {
  const sc = staticSC
  const shippingPlacebo = staticShippingPlacebo
  const didResults = staticDidResults

  return (
    <div className="mx-auto max-w-4xl space-y-6">

      {/* Intro */}
      <Panel title="WHAT THIS PROJECT FOUND, AND WHAT IT DID NOT">
        <p className="text-sm text-ink-2 font-sans leading-relaxed">
          Ten analyses were run on this event. After an inference review, <span className="text-ink font-semibold">one</span>{' '}
          survived. The original framing of this project claimed convergent evidence from six
          independent methods; that claim does not hold, and the reasoning is set out at the bottom
          of this page. Everything below is labelled with its actual status. Exploratory sections are
          kept because falsifying your own work is part of the record — they are not results.
        </p>
      </Panel>

      {/* Reported finding */}
      <Panel title="REPORTED — WAS OIL VOLATILITY UNUSUAL BY HISTORICAL STANDARDS?" status="reported">
        <p className="text-sm text-ink-2 font-sans leading-relaxed mb-3">
          Oil-implied volatility (OVX) was regressed on equity-implied volatility (VIX) in logs,
          fit on {(4731).toLocaleString()} pre-event days so the shock could not bend the line it is
          measured against. The question is not whether a coefficient differs from zero — with
          near-integrated residuals no asymptotic p-value is trustworthy. Instead the closure
          window's mean deviation is compared against{' '}
          <span className="text-ink">every other 77-day window since OVX began in 2007</span>.
          The null distribution is built from real data, so it carries the real persistence and
          assumes nothing about the error process.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { k: 'OBSERVED PREMIUM', v: `+${ovxPlacebo.premiumLog.toFixed(3)} log pts`, c: 'text-reported' },
            { k: 'WINDOWS MORE EXTREME', v: `${ovxPlacebo.exceedances} of ${ovxPlacebo.nNullWindows.toLocaleString()}`, c: 'text-reported' },
            { k: 'CONSERVATIVE p', v: `${ovxPlacebo.pNonOverlapping}`, c: 'text-ink' },
            { k: 'FIT R²', v: `${ovxPlacebo.fitR2}`, c: 'text-ink' },
          ].map(r => (
            <div key={r.k} className="bg-bg border border-line p-3">
              <span className="font-mono text-micro text-ink-3 block mb-1">{r.k}</span>
              <span className={`font-mono text-sm font-semibold ${r.c}`}>{r.v}</span>
            </div>
          ))}
        </div>
        <Callout tone="reported" title="WHAT THIS DOES NOT SHOW">
          {ovxPlacebo.caveat} The conservative p of {ovxPlacebo.pNonOverlapping} is the floor this
          design can resolve — with 61 independent windows, zero exceedances is the most extreme
          result obtainable. Nearest historical rival: {ovxPlacebo.nearestRival}.
        </Callout>
      </Panel>

      {/* Method — Event Study */}
      <Panel title="EXPLORATORY — DID STOCKS REACT ABNORMALLY?" status="exploratory">
        <p className="text-sm text-ink-2 font-sans leading-relaxed mb-3">
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
              <span className="font-mono text-micro text-ink-3">{r.k}</span>
              <span className="text-xs text-ink">{r.v}</span>
            </div>
          ))}
        </div>
        <Callout tone="refuted" title="WHY THIS IS NOT REPORTED">
          The market models have almost no explanatory power — R² runs 0.000–0.022 across the tanker
          basket, and roughly 0.000 for defense against SPY — so the "abnormal" returns are close to
          raw returns. No standard errors or test statistics were computed on any CAR. The EU
          benchmark and FX series were fetched live and never persisted, so the dual-benchmark
          defense result cannot be reproduced from this repository at all.
        </Callout>
      </Panel>

      {/* Method — Synthetic Control */}
      <Panel title="EXPLORATORY — WHAT WOULD OIL HAVE COST WITHOUT THE WAR?" status="refuted">
        <p className="text-sm text-ink-2 font-sans leading-relaxed mb-3">
          A synthetic Brent counterfactual was built from Dubai crude and FRED WTI, with a separate
          futures estimate from the demeaned Brent–WTI spread.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {[
            { k: 'PRE-WAR FIT ERROR', v: `$${sc.prePeriodRMSE}/bbl` },
            { k: 'SPOT ESTIMATE', v: `+$${sc.spotATT}/bbl` },
            { k: 'FUTURES ESTIMATE', v: `+$${sc.futuresATT}/bbl` },
          ].map(r => (
            <div key={r.k} className="bg-bg border border-line p-3">
              <span className="font-mono text-micro text-ink-3 block mb-1">{r.k}</span>
              <span className="font-mono text-sm font-semibold text-ink-3 line-through">{r.v}</span>
            </div>
          ))}
        </div>
        <div className="font-mono text-micro text-ink-3 mb-2">
          DONOR WEIGHTS (HOW THE SYNTHETIC WAS BUILT)
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-line">
              {['COMMODITY', 'WEIGHT', 'BAR'].map(h => (
                <th key={h} className="text-left py-1.5 font-mono text-micro text-ink-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sc.donorWeights.map(d => (
              <tr key={d.name} className="border-b border-line last:border-0">
                <td className="py-2 font-sans text-xs text-ink">{d.name.split(' (')[0]}</td>
                <td className="py-2 font-mono font-semibold text-sm text-ink-3">{d.weight.toFixed(1)}%</td>
                <td className="py-2">
                  <div className="bg-line h-1.5 w-full max-w-[120px]">
                    <div className="h-full" style={{ width: `${d.weight}%`, background: '#8a949e' }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Callout tone="refuted" title="THIS METHOD FALSIFIED ITSELF">
          The primary specification returned a <span className="text-ink font-semibold">negative</span>{' '}
          estimate of −$3.77/bbl against a WTI placebo of −$2.99/bbl — a ratio of 1.3×, and the
          notebook's own decision rule printed the warning. Its donor pool put 77.1% weight on Brent
          spot while the treated unit was Brent futures, so the "synthetic Brent" was mostly Brent.
          The specification shown above, which replaced it, has no placebo test at all, and 20.2% of
          its counterfactual is a Dubai series whose last observation predates treatment and is held
          flat — a counterfactual that is constant by construction. The futures figure is not a
          synthetic control: with one donor the convexity constraint pins the weight to 1.0, making
          it the demeaned Brent–WTI spread.
        </Callout>
      </Panel>

      {/* Method — Shipping Placebo */}
      <Panel title="EXPLORATORY — DID HORMUZ TANKERS SPECIFICALLY SUFFER MORE?" status="exploratory">
        <p className="text-sm text-ink-2 font-sans leading-relaxed mb-3">
          The best identification idea in this project: tankers routed through the strait versus
          similar ships on other routes — same industry, same oil-price exposure, same war, differing
          only in geography.
        </p>
        <div className="flex gap-3">
          <div className="flex-1 bg-bg border border-line p-3 text-center">
            <div className="font-mono text-micro text-ink-3 mb-1">HORMUZ TANKERS</div>
            <div className="font-mono text-micro text-ink-3 mb-2">FRO, STNG</div>
            <div className="font-mono font-bold text-lg text-ink-2">
              {shippingPlacebo.hormuzCAR.toFixed(1)}%
            </div>
          </div>
          <div className="flex items-center font-mono text-ink-3 text-sm">vs</div>
          <div className="flex-1 bg-bg border border-line p-3 text-center">
            <div className="font-mono text-micro text-ink-3 mb-1">OTHER ROUTES</div>
            <div className="font-mono text-micro text-ink-3 mb-2">HAFNI, INSW, NAT, TK</div>
            <div className="font-mono font-bold text-lg text-ink-2">
              {shippingPlacebo.nonHormuzCAR.toFixed(1)}%
            </div>
          </div>
          <div className="flex items-center font-mono text-ink-3 text-sm">=</div>
          <div className="flex-1 bg-bg border border-line p-3 text-center">
            <div className="font-mono text-micro text-ink-3 mb-1">GAP (p = {shippingPlacebo.pPermutation})</div>
            <div className="font-mono font-bold text-lg text-ink-2">
              {shippingPlacebo.gap.toFixed(1)}pp
            </div>
          </div>
        </div>
        <Callout tone="refuted" title="THE DESIGN CANNOT REACH SIGNIFICANCE">
          An exact permutation test over all C(6,2) = 15 ways of splitting six tankers into a 2/4
          treated/control split ranks the observed gap{' '}
          <span className="text-ink font-semibold">second</span>, one-sided p ={' '}
          {shippingPlacebo.pPermutation}. With six tankers the smallest attainable p-value is{' '}
          {shippingPlacebo.minAttainableP}, so no effect size could have produced a 5% result here.
          The previously published gap of −7.94pp appeared in no notebook output and has been
          removed; the reproducible value is {shippingPlacebo.gap.toFixed(2)}pp.
        </Callout>
      </Panel>

      {/* Method — DiD */}
      <Panel title="EXPLORATORY — HOW MUCH DID OIL RISE ABOVE OTHER ENERGY?" status="exploratory">
        <p className="text-sm text-ink-2 font-sans leading-relaxed mb-3">
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
            <div key={r.label} className="flex-1 bg-bg border border-line p-3 text-center">
              <div className="font-mono text-micro text-ink-3 mb-1">{r.label}</div>
              <div className="font-mono font-bold text-lg text-ink-2">{r.val}</div>
              <div className="font-mono text-micro text-ink-3 mt-0.5">{r.sub}</div>
            </div>
          ))}
        </div>
        <Callout tone="refuted" title="FOUR INDEPENDENT PROBLEMS">
          <span className="text-ink">Inference:</span> the panel has four entities.
          Cluster-robust standard errors need roughly 30–50 clusters, and the HC3 "cross-check" is
          worse — it treats 628 autocorrelated daily prices as independent draws. The effective
          sample size is 4, so t = 4.63 carries no information.{' '}
          <span className="text-ink">Specification:</span> a non-stationary price level regressed
          on a step dummy with no serial-correlation correction.{' '}
          <span className="text-ink">Parallel trends:</span> p = 0.47 is a failure to reject on
          an underpowered test, read as confirmation; note also that the control basket falls from
          107.3 to 96.8, so much of the "premium" is the control declining.{' '}
          <span className="text-ink">Timing:</span> treatment is dated to the Feb 28 strikes, not
          the Mar 7 closure, so this is a war premium rather than a chokepoint premium.
        </Callout>
      </Panel>

      {/* The convergence claim */}
      <Panel title="WHY THE 'SIX INDEPENDENT METHODS' CLAIM DOES NOT HOLD">
        <p className="text-sm text-ink-2 font-sans leading-relaxed">
          These analyses run on the same three to six price series. The difference-in-differences and
          the commodity placebo use <span className="text-ink">identical</span> treatment and
          control baskets — they are one comparison with two base dates, which is why they disagree
          by a factor of thirty. The basis spread is a subtraction of two other estimates
          (${sc.spotATT} − ${sc.futuresATT}). The futures "synthetic control" is a spread. Convergent
          evidence requires independent identifying variation; one event differenced six ways is the
          same number reported six times.
        </p>
      </Panel>

      {/* Data sources */}
      <Panel title="DATA SOURCES AND REPLICATION">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
          {[
            { source: 'Yahoo Finance (yfinance)', series: '^OVX, ^VIX, ^GVZ, ^MOVE — reported finding' },
            { source: 'Yahoo Finance (yfinance)', series: 'BZ=F, CL=F, LMT, RTX, NOC, XOM, CVX, BP, FRO, STNG, SPY' },
            { source: 'FRED (EIA)', series: 'DCOILBRENTEU, DCOILWTICO, DHHNGSP' },
            { source: 'FRED (IMF)', series: 'POILDUBUSDM — Dubai crude, monthly; ends before treatment' },
          ].map(d => (
            <div key={d.source + d.series} className="bg-bg p-2.5 border border-line">
              <div className="font-mono text-micro text-ink-3 mb-0.5">{d.source}</div>
              <div className="font-mono text-xs text-reported">{d.series}</div>
            </div>
          ))}
        </div>
        <a
          href="https://github.com/Aman12x/HormuzWatch"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 font-mono text-xs text-reported hover:text-blue-400 transition-colors border border-line px-3 py-2 hover:border-blue-500"
        >
          <ExternalLink size={12} />
          github.com/Aman12x/HormuzWatch — notebooks, refit scripts, data
        </a>
        <p className="text-ink-3 text-micro font-mono mt-3">
          METHOD REFS: Abadie, Diamond &amp; Hainmueller (2010) in-time placebo · Brown &amp; Warner
          (1985) event study · Bertrand, Duflo &amp; Mullainathan (2004) on serial correlation in DiD
        </p>
      </Panel>

    </div>
  )
}
