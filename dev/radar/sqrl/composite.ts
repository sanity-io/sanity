import {COMMIT_WINDOW, INP_PILLAR_WEIGHT, type SqrlPillarKey} from './inputs'

export type ValueMap = Record<string, number | null>
export type LogRow = Record<string, number | null>
export type Weights = Record<string, number>

export function median(values: number[]): number {
  const sorted = values.toSorted((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle]
}

function present(value: number | null | undefined): value is number {
  return typeof value === 'number' && value !== 0 && Number.isFinite(value)
}

/** Each input replaced by the median of its last `window` measured commits; carried forward over commits that lack it. */
export function rollingMedian(
  series: ValueMap[],
  keys: string[],
  window = COMMIT_WINDOW,
): ValueMap[] {
  const histories = new Map(keys.map((key) => [key, [] as number[]]))
  return series.map((values) =>
    Object.fromEntries(
      keys.map((key) => {
        const history = histories.get(key) ?? []
        const value = values[key]
        if (present(value)) history.push(value)
        return [key, history.length > 0 ? median(history.slice(-window)) : null]
      }),
    ),
  )
}

/** Per input, the median of its first `window` measured commits. */
export function referenceValues(
  series: ValueMap[],
  keys: string[],
  window = COMMIT_WINDOW,
): ValueMap {
  return Object.fromEntries(
    keys.map((key) => {
      const available = series.map((values) => values[key]).filter(present)
      return [key, available.length > 0 ? median(available.slice(0, window)) : null]
    }),
  )
}

/** ln(reference / value) per commit, carried forward after an input's first value, null before it. */
export function logRatioRows(series: ValueMap[], references: ValueMap, keys: string[]): LogRow[] {
  const last = new Map<string, number | null>(keys.map((key) => [key, null]))
  return series.map((values) =>
    Object.fromEntries(
      keys.map((key) => {
        const value = values[key]
        const reference = references[key]
        if (present(value) && present(reference)) last.set(key, Math.log(reference / value))
        return [key, last.get(key) ?? null]
      }),
    ),
  )
}

/**
 * Headline weights for the inputs present in a row: INP takes its fixed share
 * when present, the other pillars split the rest equally, and inputs split
 * their pillar equally — so a pillar with more metrics does not weigh more.
 */
export function headlineWeights(
  row: LogRow,
  keys: string[],
  pillarOf: (key: string) => SqrlPillarKey,
): Weights {
  const byPillar = keys
    .filter((key) => row[key] !== null)
    .reduce((groups, key) => {
      const pillar = pillarOf(key)
      groups.set(pillar, [...(groups.get(pillar) ?? []), key])
      return groups
    }, new Map<SqrlPillarKey, string[]>())
  const pillarCount = byPillar.size
  const hasInp = byPillar.has('inp')
  const shareOf = (pillar: SqrlPillarKey): number => {
    if (hasInp)
      return pillar === 'inp' ? INP_PILLAR_WEIGHT : (1 - INP_PILLAR_WEIGHT) / (pillarCount - 1)
    return 1 / pillarCount
  }
  return Object.fromEntries(
    [...byPillar].flatMap(([pillar, members]) =>
      members.map((key) => [key, shareOf(pillar) / members.length]),
    ),
  )
}

export interface ChainResult {
  levels: number[]
  weights: Weights[]
}

/**
 * Chain-linked log index: the first row is the direct weighted value, every
 * later row adds the weighted log change of each input present at both ends
 * of the step. A late input therefore enters with zero jump and only its later
 * movement counts.
 */
export function chain(
  rows: LogRow[],
  keys: string[],
  weightsFor: (row: LogRow) => Weights,
): ChainResult {
  const weights = rows.map(weightsFor)
  const levels = rows.reduce<number[]>((accumulated, row, index) => {
    const rowWeights = weights[index]
    const previous = index > 0 ? rows[index - 1] : null
    const step = keys.reduce((total, key) => {
      const weight = rowWeights[key]
      const current = row[key]
      if (weight === undefined || current === null) return total
      if (previous === null) return total + weight * current
      const before = previous[key]
      return before === null ? total : total + weight * (current - before)
    }, 0)
    return [...accumulated, (accumulated.at(-1) ?? 0) + step]
  }, [])
  return {levels, weights}
}

/** Equal weights over the members of one pillar that are present in the row. */
export function pillarWeights(members: string[]): (row: LogRow) => Weights {
  return (row) => {
    const active = members.filter((key) => row[key] !== null)
    return Object.fromEntries(active.map((key) => [key, 1 / active.length]))
  }
}
