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
 * regressions. An unrated one counts as the worst: nobody has said it is
 * anything less, so the count stays red until someone rates it down.
 */
export function worstSeverity(values: readonly unknown[]): Severity | undefined {
  let worst: Severity | undefined
  for (const value of values) {
    const severity = isSeverity(value) ? value : 'critical'
    if (!worst || SEVERITIES.indexOf(severity) > SEVERITIES.indexOf(worst)) worst = severity
  }
  return worst
}

/** @sanity/ui tone per step — the same red as the regression itself only at the top. */
export const SEVERITY_TONE: Record<Severity, 'default' | 'caution' | 'critical'> = {
  minor: 'default',
  major: 'caution',
  critical: 'critical',
}
