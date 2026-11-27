import {type QueryVerdict} from './explainQuery'

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

type InsightMessage =
  | 'vision.explain.insight.aggregate'
  | 'vision.explain.insight.batched-subquery'
  | 'vision.explain.insight.filter-in-memory'
  | 'vision.explain.insight.filter-in-memory.cannot-improve'
  | 'vision.explain.insight.index-sort-limit'
  | 'vision.explain.insight.slice-in-memory'
  | 'vision.explain.insight.slice-in-memory.cannot-improve'
  | 'vision.explain.insight.sort-in-memory'
  | 'vision.explain.insight.sort-in-memory.cannot-improve'

/** An insight as the Explain panel shows it, after reconciling it with a verdict */
export interface PresentedInsight {
  kind: PlanInsight['kind']
  tone: 'caution' | 'positive' | 'neutral'
  message: InsightMessage
  expression?: string
}

const DEFAULT_MESSAGE = {
  'aggregate': 'vision.explain.insight.aggregate',
  'batched-subquery': 'vision.explain.insight.batched-subquery',
  'filter-in-memory': 'vision.explain.insight.filter-in-memory',
  'index-sort-limit': 'vision.explain.insight.index-sort-limit',
  'slice-in-memory': 'vision.explain.insight.slice-in-memory',
  'sort-in-memory': 'vision.explain.insight.sort-in-memory',
} as const satisfies Record<PlanInsight['kind'], InsightMessage>

const CANNOT_IMPROVE_MESSAGE = {
  'filter-in-memory': 'vision.explain.insight.filter-in-memory.cannot-improve',
  'slice-in-memory': 'vision.explain.insight.slice-in-memory.cannot-improve',
  'sort-in-memory': 'vision.explain.insight.sort-in-memory.cannot-improve',
} as const satisfies Record<Extract<PlanInsight, {tone: 'caution'}>['kind'], InsightMessage>

function presentDefault(insight: PlanInsight): PresentedInsight {
  return {
    kind: insight.kind,
    tone: insight.tone,
    message: DEFAULT_MESSAGE[insight.kind],
    ...(insight.kind === 'filter-in-memory' ? {expression: insight.expression} : {}),
  }
}

/**
 * What stands out, once a verdict is in. A fast query drops the warnings that would call it
 * slow, and a query that cannot be faster restates that work without the warning or the guide.
 * With no verdict, or when the query can be improved, the heuristic stands as it was read.
 */
export function presentPlanInsights(
  insights: PlanInsight[],
  verdict: QueryVerdict | undefined,
): {insights: PresentedInsight[]; showGuide: boolean} {
  if (verdict !== 'performant' && verdict !== 'cannot-improve') {
    return {
      insights: insights.map(presentDefault),
      showGuide: insights.some((insight) => insight.tone === 'caution'),
    }
  }
  if (verdict === 'performant') {
    return {
      insights: insights.filter((insight) => insight.tone !== 'caution').map(presentDefault),
      showGuide: false,
    }
  }
  return {
    insights: insights.map((insight) =>
      insight.tone === 'caution'
        ? {
            kind: insight.kind,
            tone: 'neutral' as const,
            message: CANNOT_IMPROVE_MESSAGE[insight.kind],
            ...(insight.kind === 'filter-in-memory' ? {expression: insight.expression} : {}),
          }
        : presentDefault(insight),
    ),
    showGuide: false,
  }
}
