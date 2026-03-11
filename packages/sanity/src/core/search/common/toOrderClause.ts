import {type SearchSort} from './types'

/**
 * Returns a `select(defined(...))` expression to override the default null sorting
 * behavior, or undefined if no override is needed.
 *
 * Default behavior (matches PostgreSQL):
 * - `desc` → nulls first
 * - `asc` → nulls last
 *
 * Only generates a prefix when the user explicitly requests the opposite.
 */
function getNullSortingPrefix(ordering: SearchSort): string | undefined {
  const {direction, nulls, field} = ordering

  if (!nulls) return undefined

  const dirLower = (direction || 'asc').toLowerCase()

  const needsOverride =
    (dirLower === 'desc' && nulls === 'last') || (dirLower === 'asc' && nulls === 'first')

  if (!needsOverride) return undefined

  // nulls last: defined values sort first (0), nulls sort last (1)
  // nulls first: defined values sort last (1), nulls sort first (0)
  if (nulls === 'last') {
    return `select(defined(${field}) => 0, 1)`
  }
  return `select(defined(${field}) => 1, 0)`
}

function wrapFieldWithFn(ordering: SearchSort): string {
  return ordering.mapWith ? `${ordering.mapWith}(${ordering.field})` : ordering.field
}

export function toOrderClause(orderBy: SearchSort[]): string {
  return (orderBy || [])
    .flatMap((ordering) => {
      const nullPrefix = getNullSortingPrefix(ordering)
      const fieldClause = [wrapFieldWithFn(ordering), (ordering.direction || '').toLowerCase()]
        .map((str) => str.trim())
        .filter(Boolean)
        .join(' ')

      return nullPrefix ? [nullPrefix, fieldClause] : [fieldClause]
    })
    .join(',')
}
