/**
 * Type-7 (linear interpolation) quantile — the R/NumPy default. Matches the
 * old suite's percentile math so cross-checks during burn-in compare
 * like-for-like.
 */
export function quantile(values: number[], p: number): number {
  if (values.length === 0) {
    throw new Error('Cannot compute quantile of empty sample')
  }
  // NaN poisons every `>` comparison downstream (gate() would silently
  // report `neutral` for a real regression) — a non-finite sample is a
  // collector bug and must fail loudly here, not gate a PR green
  if (values.some((value) => !Number.isFinite(value))) {
    throw new Error('Cannot compute quantile of non-finite samples')
  }
  const sorted = values.toSorted((a, b) => a - b)
  const index = p * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  if (lower === upper) {
    return sorted[lower]
  }
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower)
}

export function median(values: number[]): number {
  return quantile(values, 0.5)
}

export interface SummaryStats {
  n: number
  median: number
  p75: number
  p90: number
  p99: number
  min: number
  max: number
}

export function summarize(values: number[]): SummaryStats {
  return {
    n: values.length,
    median: quantile(values, 0.5),
    p75: quantile(values, 0.75),
    p90: quantile(values, 0.9),
    p99: quantile(values, 0.99),
    min: Math.min(...values),
    max: Math.max(...values),
  }
}
