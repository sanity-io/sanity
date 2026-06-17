import {type ReferenceSearchSpec} from '../common/deriveReferenceSearchSpecs'
import {prefixLast} from '../common/token'

// Bounds the resolved-id set for very common terms. Inlined as a literal because
// GROQ rejects a parameterised slice bound ("slicing must use constant numbers").
const REFERENCE_RESOLVE_LIMIT = 1000

/**
 * @internal
 */
export interface ReferenceResolveQuery {
  query: string
  params: {__query: string}
}

/**
 * @internal
 *
 * Builds the phase-one query resolving ids of documents whose preview-referenced
 * leaves match the term. Each clause is an index-accelerated `_type == … && leaf
 * match …`, so no per-document join occurs. Returns `undefined` when there are no
 * specs to resolve.
 */
export function createReferenceResolveQuery(
  specs: ReferenceSearchSpec[],
  rawQuery: string,
): ReferenceResolveQuery | undefined {
  if (specs.length === 0) {
    return undefined
  }

  const clauses = Array.from(
    new Set(
      specs.map((spec) => {
        const matchTarget = spec.mapWith ? `${spec.mapWith}(${spec.leafPath})` : spec.leafPath
        return `(_type == "${spec.targetType}" && ${matchTarget} match text::query($__query))`
      }),
    ),
  )

  return {
    // Slice before projecting `._id`: `..._id[0...n]` binds the slice to the
    // `_id` string and yields `null` per element; `...[0...n]._id` is correct.
    query: `*[${clauses.join(' || ')}][0...${REFERENCE_RESOLVE_LIMIT}]._id`,
    params: {
      __query: prefixLast(rawQuery),
    },
  }
}
