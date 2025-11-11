/**
 * Replaces `{{variable}}` patterns with values from the provided object.
 *
 * Unlike lodash's `template()`, this uses regex replacement instead of
 * `new Function()`, making it CSP-compliant without 'unsafe-eval'.
 *
 * @param template - Template string with `{{variable}}` placeholders
 * @param values - Values to interpolate
 * @returns Interpolated string (missing variables are preserved as-is)
 *
 * @internal
 */
export function interpolateTemplate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const value = values[key]
    return value === undefined ? match : String(value)
  })
}
