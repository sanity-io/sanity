export interface Summary {
  max: number
  median: number
  min: number
  p75: number
  samples: number[]
}

export interface Delta {
  absolute: number
  /** Relative to the v6 value; `null` when v6 is zero. */
  percent: number | null
}

/** Linear-interpolated percentile of an unsorted list, `p` in 0..100. */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) throw new Error('Cannot take a percentile of no samples')
  const sorted = values.toSorted((a, b) => a - b)
  const rank = (p / 100) * (sorted.length - 1)
  const lower = Math.floor(rank)
  const upper = Math.ceil(rank)
  return sorted[lower]! + (sorted[upper]! - sorted[lower]!) * (rank - lower)
}

export function summarize(samples: number[]): Summary {
  return {
    max: Math.max(...samples),
    median: percentile(samples, 50),
    min: Math.min(...samples),
    p75: percentile(samples, 75),
    samples,
  }
}

export function delta(v6: number, v7: number): Delta {
  return {absolute: v7 - v6, percent: v6 === 0 ? null : ((v7 - v6) / v6) * 100}
}
