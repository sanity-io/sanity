import {ORDERINGS_PROJECTION_KEY, type SearchSort} from './types'

/**
 * Returns the GROQ expression that addresses the value being sorted
 * on, after the projection has run.
 *
 * Every sort entry is projected into the top-level `orderings`
 * array by `compileSortExpression`, so the address is always
 * `orderings[<projectionIndex>]`.
 *
 * If a caller passes a `SearchSort` without a `projectionIndex`
 * (i.e. one that hasn't been threaded through
 * `compileSortExpression`), this falls back to the literal `field`
 * so that the produced clause is at least syntactically valid.
 */
function getSortTarget(ordering: SearchSort): string {
  if (ordering.projectionIndex === undefined) {
    return ordering.field
  }
  return `${ORDERINGS_PROJECTION_KEY}[${ordering.projectionIndex}]`
}

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
  const {direction, nulls} = ordering

  if (!nulls) return undefined

  const dirLower = (direction || 'asc').toLowerCase()

  const needsOverride =
    (dirLower === 'desc' && nulls === 'last') || (dirLower === 'asc' && nulls === 'first')

  if (!needsOverride) return undefined

  const target = getSortTarget(ordering)

  // nulls last: defined values sort first (0), nulls sort last (1)
  // nulls first: defined values sort last (1), nulls sort first (0)
  if (nulls === 'last') {
    return `select(defined(${target}) => 0, 1)`
  }
  return `select(defined(${target}) => 1, 0)`
}

function wrapFieldWithFn(ordering: SearchSort): string {
  const target = getSortTarget(ordering)
  return ordering.mapWith ? `${ordering.mapWith}(${target})` : target
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
