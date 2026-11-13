/**
 * A query duration, written with the same precision as `formatBytes`: no fraction below
 * 1000ms (`888ms`), then one larger unit (`1.17s`). Minutes, hours and days take over once
 * the previous unit would read as 60 (or 24 hours). Suffixes are the narrow unit names
 * (`888ms`, `1.17s`, `1.50m`), the same shape `Intl.NumberFormat` gives `unitDisplay: 'narrow'`.
 */
const SECOND = 1_000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const STEPS = [
  {size: SECOND, suffix: 's', span: 60},
  {size: MINUTE, suffix: 'm', span: 60},
  {size: HOUR, suffix: 'h', span: 24},
] as const

export function formatDuration(milliseconds: number): string {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) {
    return '0ms'
  }

  const rounded = Math.round(milliseconds)
  if (rounded < SECOND) {
    return `${rounded}ms`
  }

  for (const step of STEPS) {
    const shown = formatAmount(rounded / step.size)
    if (Number(shown) < step.span) {
      return `${shown}${step.suffix}`
    }
  }

  return `${formatAmount(rounded / DAY)}d`
}

/** Same fraction rule as `formatBytes`: two digits under 10, one under 100, none after that */
function formatAmount(value: number): string {
  const digits = value < 10 ? 2 : value < 100 ? 1 : 0
  return value.toFixed(digits)
}
