import {getPublishedId} from '../../util/draftUtils'

/**
 * Recursively walks a query result tree to find all `_id` values in nested
 * objects. Skips the root `_id` (that's the document itself). Used to track
 * which referenced documents should trigger a refetch.
 * @internal
 */
export function extractAllReferencedIds(result: Record<string, unknown> | null): Set<string> {
  const ids = new Set<string>()
  if (!result) return ids

  function walk(obj: Record<string, unknown>, skipOwnId: boolean): void {
    if (!skipOwnId && typeof obj._id === 'string') {
      ids.add(getPublishedId(obj._id))
    }
    for (const value of Object.values(obj)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        walk(value as Record<string, unknown>, false)
      }
    }
  }

  walk(result, true)
  return ids
}
