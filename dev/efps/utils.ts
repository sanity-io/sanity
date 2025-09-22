const WARNING_THRESHOLD = 0.2

export function isSignificantlyDifferent(experiment: number, reference: number): boolean {
  // values are too small to and are already performing well
  if (experiment < 16 && reference < 16) return false
  const delta = (experiment - reference) / reference
  return delta >= WARNING_THRESHOLD
}

export const formatPercentageChange = (experiment: number, reference: number): string => {
  if (experiment < 16 && reference < 16) return '-/-%'
  const delta = (experiment - reference) / reference
  if (!delta) return '-/-%'
  const percentage = delta * 100
  const rounded = percentage.toFixed(1)
  const sign = delta >= 0 ? '+' : ''
  return `${sign}${rounded}%`
}
