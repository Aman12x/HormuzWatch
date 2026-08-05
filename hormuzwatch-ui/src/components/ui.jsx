/**
 * Shared presentation primitives.
 *
 * Every status in this project is one of three things, and the distinction is
 * the whole point of the archive — so it is encoded once, here, rather than
 * restyled per tab:
 *
 *   reported     the one finding that survived inference review
 *   exploratory  retained for transparency; not a result  (neutral, recessive)
 *   refuted      failed its own falsification test        (red)
 *
 * Status is never carried by colour alone: every badge ships its label.
 */

const STATUS = {
  reported: {
    label: 'Reported finding',
    text: 'text-reported',
    border: 'border-reported/40',
    bg: 'bg-reported/10',
    rule: '#1d68c3',
  },
  exploratory: {
    label: 'Exploratory — not reported',
    text: 'text-ink-2',
    border: 'border-line-strong',
    bg: 'bg-surface-3',
    rule: '#8a949e',
  },
  refuted: {
    label: 'Failed its own placebo test',
    text: 'text-refuted',
    border: 'border-refuted/40',
    bg: 'bg-refuted/10',
    rule: '#c0272d',
  },
}

export function Badge({ status, children }) {
  const s = STATUS[status] ?? STATUS.exploratory
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded px-2 py-1 font-mono text-micro uppercase border ${s.text} ${s.border} ${s.bg}`}
    >
      {children ?? s.label}
    </span>
  )
}

/** Panel with an optional eyebrow title and status badge. */
export function Panel({ title, status, actions, className = '', children }) {
  return (
    <section className={`card ${className}`}>
      {(title || status || actions) && (
        <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-5 py-3.5">
          {title && <h2 className="eyebrow flex-1">{title}</h2>}
          {status && <Badge status={status} />}
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  )
}

/**
 * A single number with its label and reading.
 * `emphasis` promotes the value to the accent colour — reserved for the
 * reported finding, so a glance at the page shows what actually held up.
 */
export function Stat({ label, value, unit, note, emphasis = false }) {
  return (
    <div className="card flex flex-col p-4">
      <span className="eyebrow">{label}</span>
      <div className="mt-2.5 flex items-baseline gap-1.5">
        <span
          className={`tnum font-mono text-stat font-medium ${emphasis ? 'text-reported' : 'text-ink'}`}
        >
          {value}
        </span>
        {unit && <span className="text-label text-ink-3">{unit}</span>}
      </div>
      {note && <p className="mt-2.5 text-label leading-5 text-ink-2">{note}</p>}
    </div>
  )
}

/** Callout for a caveat, limitation or failure explanation. */
export function Callout({ tone = 'neutral', title, children }) {
  const rule = tone === 'refuted' ? '#c0272d' : tone === 'reported' ? '#1d68c3' : '#c6ced6'
  const titleColor =
    tone === 'refuted' ? 'text-refuted' : tone === 'reported' ? 'text-reported' : 'text-ink-2'
  return (
    <div className="mt-4 flex gap-3.5 rounded bg-surface-2 p-4">
      <span className="w-0.5 flex-shrink-0 rounded-full" style={{ background: rule }} />
      <div className="min-w-0">
        {title && (
          <div className={`mb-1.5 font-mono text-micro uppercase ${titleColor}`}>{title}</div>
        )}
        <div className="text-label leading-6 text-ink-2">{children}</div>
      </div>
    </div>
  )
}

/** Label/value rows — replaces the ad-hoc two-column grids. */
export function DataList({ rows }) {
  return (
    <dl className="divide-y divide-line">
      {rows.map(r => (
        <div key={r.k} className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
          <dt className="text-label text-ink-3">{r.k}</dt>
          <dd className={`tnum font-mono text-label ${r.color ?? 'text-ink'}`}>{r.v}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Banner for tabs whose contents did not survive review. */
export function ExploratoryBanner({ children }) {
  return (
    <div className="flex gap-3.5 rounded border border-line-strong bg-surface-2 p-4">
      <span className="w-0.5 flex-shrink-0 rounded-full bg-ink-3" />
      <div>
        <div className="mb-1.5 font-mono text-micro uppercase text-ink-2">
          Exploratory — not reported as findings
        </div>
        <p className="max-w-prose text-label leading-6 text-ink-2">
          {children} The one reported finding is the OVX volatility result on the Overview tab; see
          Method for the specific failure behind each analysis here.
        </p>
      </div>
    </div>
  )
}

/** Shared recharts theming so every chart in the app agrees. */
export const CHART = {
  grid: '#e2e6ea',
  axis: '#626c76',
  surface: '#ffffff',
  // Fixed order — violet sits third to break the protan orange↔green pair.
  series: ['#1d68c3', '#d9531f', '#6b3fa0', '#12805a'],
  context: '#8a949e',
  reported: '#1d68c3',
  refuted: '#c0272d',
  tick: { fill: '#626c76', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' },
}

export function ChartTooltip({ active, payload, label, unit = '', labelPrefix = '' }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded border border-line-strong bg-surface-2 px-3 py-2 shadow-lg">
      {label != null && (
        <div className="mb-1.5 font-mono text-micro uppercase text-ink-3">
          {labelPrefix}
          {label}
        </div>
      )}
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2.5 py-0.5">
          <span
            className="h-2 w-2 flex-shrink-0 rounded-full"
            style={{ background: p.color ?? p.stroke ?? p.fill }}
          />
          <span className="flex-1 text-label text-ink-2">{p.name}</span>
          <span className="tnum font-mono text-label text-ink">
            {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
            {unit}
          </span>
        </div>
      ))}
    </div>
  )
}
