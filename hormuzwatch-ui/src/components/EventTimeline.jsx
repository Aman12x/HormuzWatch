import { timelineEvents } from '../data/metrics.js'

/**
 * Chronology. Rendered inside a Panel, so it carries no chrome of its own.
 * The marker for the closing event is filled to mark where the record stops;
 * everything else is a hollow node on a single recessive rule.
 */
export default function EventTimeline() {
  return (
    <ol className="relative space-y-6">
      <span className="absolute bottom-2 left-[3.5px] top-2 w-px bg-line" aria-hidden="true" />

      {timelineEvents.map(ev => {
        const isFinal = ev.type === 'final'
        return (
          <li key={ev.date} className="relative pl-6">
            <span
              className={`absolute left-0 top-1.5 h-2 w-2 rounded-full ring-4 ring-surface ${
                isFinal ? 'bg-reported' : 'bg-line-strong'
              }`}
              aria-hidden="true"
            />
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <time className="tnum font-mono text-micro uppercase text-ink-3">{ev.date}</time>
              {isFinal && (
                <span className="font-mono text-micro uppercase text-reported">Window ends</span>
              )}
            </div>
            <h3 className="mt-1 text-h3 font-medium text-ink">{ev.label}</h3>
            <p className="mt-1 text-label leading-6 text-ink-2">{ev.description}</p>
          </li>
        )
      })}
    </ol>
  )
}
