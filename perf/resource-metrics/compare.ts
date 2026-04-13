import {type ComparisonResult, type ResourceMetrics, type ScenarioResult} from './types'

// Metrics where we expect exact (0%) tolerance — pure counting metrics
export const EXACT_METRICS: Array<keyof ResourceMetrics> = [
  'httpRequestCount',
  'domNodeCount',
  'jsEventListenerCount',
]

// Metrics with tolerance bands
export const TOLERANT_METRICS: Partial<Record<keyof ResourceMetrics, number>> = {
  jsHeapUsedBytes: 0.1, // 10% — forced GC still has some variance
  httpTransferBytes: 0.05, // 5% — response headers, timestamps, etc. can vary slightly
}

export function compareResults(
  reference: ScenarioResult,
  experiment: ScenarioResult,
): ComparisonResult {
  const delta = {} as ComparisonResult['delta']

  for (const key of Object.keys(reference.metrics) as Array<keyof ResourceMetrics>) {
    const refVal = reference.metrics[key]
    const expVal = experiment.metrics[key]
    const absolute = expVal - refVal
    const percent = refVal === 0 ? (expVal === 0 ? 0 : Infinity) : absolute / refVal

    delta[key] = {absolute, percent}
  }

  return {
    scenario: reference.scenario,
    reference: reference.metrics,
    experiment: experiment.metrics,
    delta,
  }
}

export function hasSignificantRegression(comparison: ComparisonResult): boolean {
  for (const key of EXACT_METRICS) {
    if (comparison.delta[key].absolute > 0) return true
  }

  for (const [key, tolerance] of Object.entries(TOLERANT_METRICS)) {
    const metricKey = key as keyof ResourceMetrics
    if (comparison.delta[metricKey].percent > tolerance) return true
  }

  return false
}
