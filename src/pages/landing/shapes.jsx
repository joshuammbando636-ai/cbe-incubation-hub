// Decorative shapes and the round CBE badge. All aria-hidden.

const PATHS = {
  square: 'M0 0H100V100H0Z',
  circle: 'M50 0A50 50 0 1 1 50 100A50 50 0 1 1 50 0Z',
  quarter: 'M0 100V0A100 100 0 0 1 100 100Z',
  triangle: 'M0 0L100 100H0Z',
  leaf: 'M0 100V50A50 50 0 0 1 50 0H100V50A50 50 0 0 1 50 100Z',
  arch: 'M0 100V50A50 50 0 0 1 100 50V100Z',
}

export function Shape({ kind, className = '', style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <path d={PATHS[kind]} fill="currentColor" />
    </svg>
  )
}

// tone: 'blue' (blue circle, white mark) or 'white' (white circle, midnight mark).
export function Badge({ tone = 'blue', className = '' }) {
  return (
    <span className={`l-badge l-badge--${tone} ${className}`} aria-hidden="true">
      CBE
    </span>
  )
}
