/**
 * Recursively walks a query result tree to build a composite key from all
 * `_rev` values (root + any nested objects). Used by `distinctUntilChanged`
 * to detect changes at any nesting depth.
 * @internal
 */
export function allRevKeys(result: Record<string, unknown> | null): string {
  if (!result) return ''
  const parts: string[] = []

  function walk(obj: Record<string, unknown>): void {
    if (typeof obj._rev === 'string') {
      parts.push(obj._rev)
    }
    for (const value of Object.values(obj)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        walk(value as Record<string, unknown>)
      }
    }
  }

  walk(result)
  return parts.join(':')
}
