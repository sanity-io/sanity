/**
 * What stands out in a Content Lake query plan (the query endpoint's `explain` text), read from
 * the steps it names. A `FilterStep` filters rows in memory after they were read (a join with
 * `->` or a function in the filter), a `SortStep` or `SliceStep` sorts or slices in memory;
 * a `Fetch` with `Sort`/`Limit` lines does that in the index, a `HashBatchStep` runs a subquery
 * once for every row, and an `Aggregate` counts in the index.
 */

export const HIGH_PERFORMANCE_GROQ_URL =
  'https://www.sanity.io/docs/developer-guides/high-performance-groq'

export type PlanInsight =
  /** `expression` is what the `FilterStep` evaluates */
  | {kind: 'filter-in-memory'; tone: 'caution'; expression: string}
  | {kind: 'sort-in-memory'; tone: 'caution'}
  | {kind: 'slice-in-memory'; tone: 'caution'}
  | {kind: 'index-sort-limit'; tone: 'positive'}
  | {kind: 'batched-subquery'; tone: 'positive'}
  | {kind: 'aggregate'; tone: 'positive'}

const FILTER_STEP = /\bFilterStep\s*\{[^}]*?Expr:\s*([^\n}]+)/g

function hasLine(plan: string, pattern: RegExp): boolean {
  return pattern.test(plan)
}

export function readPlanInsights(plan: string): PlanInsight[] {
  const insights: PlanInsight[] = []
  for (const match of plan.matchAll(FILTER_STEP)) {
    insights.push({kind: 'filter-in-memory', tone: 'caution', expression: match[1].trim()})
  }
  if (hasLine(plan, /\bSortStep\b/)) insights.push({kind: 'sort-in-memory', tone: 'caution'})
  if (hasLine(plan, /\bSliceStep\b/)) insights.push({kind: 'slice-in-memory', tone: 'caution'})
  if (hasLine(plan, /^\s*Sort:/m) && hasLine(plan, /^\s*Limit:/m)) {
    insights.push({kind: 'index-sort-limit', tone: 'positive'})
  }
  if (hasLine(plan, /\bHashBatchStep\b/))
    insights.push({kind: 'batched-subquery', tone: 'positive'})
  if (hasLine(plan, /^\s*Aggregate\s*\{/m)) insights.push({kind: 'aggregate', tone: 'positive'})
  return insights
}
