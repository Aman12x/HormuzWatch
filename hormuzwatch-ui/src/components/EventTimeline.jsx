import { timelineEvents } from '../data/metrics.js'

const TYPE_COLORS = {
  critical   : '#ef4444',
  escalation : '#e8b84b',
  current    : '#10b981',
  default    : '#475569',
}

export default function EventTimeline() {
  return (
    <div className="bg-hw-card border border-hw-border p-4">
      <div className="font-mono text-[10px] tracking-[0.2em] text-hw-muted mb-4">
        EVENT TIMELINE — CONFLICT CHRONOLOGY
      </div>
      <div className="relative">
        {/* Vertical line */}
        <div
          className="absolute left-3 top-0 bottom-0 w-px"
          style={{ background: 'linear-gradient(180deg, #ef444455, #e8b84b44, #10b98133)' }}
        />

        <div className="space-y-5 pl-10">
          {timelineEvents.map((ev, i) => {
            const color = TYPE_COLORS[ev.type] || TYPE_COLORS.default
            return (
              <div key={i} className="relative">
                {/* Dot */}
                <div
                  className="absolute -left-[1.65rem] top-0.5 w-3 h-3 rounded-full border-2 bg-hw-bg"
                  style={{ borderColor: color }}
                />
                {/* Pulse on current */}
                {ev.type === 'current' && (
                  <div
                    className="absolute -left-[1.65rem] top-0.5 w-3 h-3 rounded-full animate-ping opacity-40"
                    style={{ backgroundColor: color }}
                  />
                )}

                <div>
                  <div className="flex items-center gap-3 mb-0.5">
                    <span className="font-mono text-[10px] tracking-wider" style={{ color }}>
                      {ev.date}
                    </span>
                    {ev.type === 'critical' && (
                      <span
                        className="font-mono text-[9px] tracking-wider px-1 py-0.5"
                        style={{ color: '#ef4444', borderColor: '#ef444433', border: '1px solid', background: '#ef444411' }}
                      >
                        CRITICAL
                      </span>
                    )}
                  </div>
                  <div className="font-inter font-semibold text-hw-text text-sm">
                    {ev.label}
                  </div>
                  <div className="font-inter text-hw-sub text-xs mt-0.5 leading-relaxed">
                    {ev.description}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
