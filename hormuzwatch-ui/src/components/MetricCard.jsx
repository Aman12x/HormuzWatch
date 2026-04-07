import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const ACCENT = {
  gold  : '#e8b84b',
  green : '#10b981',
  red   : '#ef4444',
  blue  : '#3b82f6',
  muted : '#475569',
}

export default function MetricCard({
  label,
  value,
  unit     = '',
  delta    = null,    // number or null
  deltaLabel = '',
  description = '',
  accent  = 'gold',
  className = '',
  children,
}) {
  const color = ACCENT[accent] || ACCENT.gold
  const isPositive = delta !== null && delta > 0
  const isNegative = delta !== null && delta < 0

  return (
    <div
      className={`bg-hw-card border border-hw-border relative overflow-hidden ${className}`}
      style={{ borderTopColor: color, borderTopWidth: 2 }}
    >
      {/* Subtle background glow */}
      <div
        className="absolute top-0 left-0 right-0 h-12 opacity-5 pointer-events-none"
        style={{ background: `linear-gradient(180deg, ${color}, transparent)` }}
      />

      <div className="p-4 relative">
        {/* Label */}
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] tracking-[0.2em] text-hw-muted uppercase">
            {label}
          </span>
          {delta !== null && (
            <span
              className="flex items-center gap-0.5 font-mono text-[10px]"
              style={{ color: isPositive ? ACCENT.green : isNegative ? ACCENT.red : ACCENT.muted }}
            >
              {isPositive ? (
                <TrendingUp size={10} />
              ) : isNegative ? (
                <TrendingDown size={10} />
              ) : (
                <Minus size={10} />
              )}
              {deltaLabel}
            </span>
          )}
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-1.5">
          <span
            className="font-mono font-bold leading-none"
            style={{ fontSize: '1.9rem', color, fontVariantNumeric: 'tabular-nums' }}
          >
            {value}
          </span>
          {unit && (
            <span className="font-mono text-hw-sub text-sm">{unit}</span>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="mt-2 text-hw-sub text-xs leading-relaxed font-inter">
            {description}
          </p>
        )}

        {children}
      </div>
    </div>
  )
}
