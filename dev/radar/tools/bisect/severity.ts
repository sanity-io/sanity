/**
 * How bad a confirmed regression is — a human call made on the verdict card
 * or when reporting one by hand, stored as `result.severity`. Three steps
 * are enough to sort a release's regressions; anything finer is a Linear
 * field, not a dashboard flag.
 */
export const SEVERITIES = ['minor', 'major', 'critical'] as const
export type Severity = (typeof SEVERITIES)[number]

export function isSeverity(value: unknown): value is Severity {
  return typeof value === 'string' && (SEVERITIES as readonly string[]).includes(value)
}

export const SEVERITY_LABEL: Record<Severity, string> = {
  minor: 'Minor',
  major: 'Major',
  critical: 'Critical',
}

/**
 * The worst of several ratings, for toning a count that stands for many
 * regressions. Unrated ones are ignored: a tone means someone rated it, so
 * a count that is red really does hold a critical regression.
 */
export function worstSeverity(values: readonly unknown[]): Severity | undefined {
  let worst: Severity | undefined
  for (const value of values) {
    if (!isSeverity(value)) continue
    if (!worst || SEVERITIES.indexOf(value) > SEVERITIES.indexOf(worst)) worst = value
  }
  return worst
}

/** @sanity/ui tone per step — the same red as the regression itself only at the top. */
export const SEVERITY_TONE: Record<Severity, 'default' | 'caution' | 'critical'> = {
  minor: 'default',
  major: 'caution',
  critical: 'critical',
}
