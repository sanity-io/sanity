import {type QueryParams} from '@sanity/client'

/** A single count request: the schema type name to count documents of. */
export interface CountDescriptor {
  type: string
}

/** One aggregate query counting every descriptor, keyed by the descriptor's index. */
export interface CombinedCountQuery {
  query: string
  params: QueryParams
}

/**
 * Upper bound on the length a descriptor contributes to a combined query, used to size chunks
 * before `combineCountQuery` runs. The type name always travels as a param, so every member
 * contributes the same query text regardless of type name - only the index's digit count varies.
 * Assumes a 4-digit projection index, which chunking never reaches (`MAX_DOCUMENT_ID_CHUNK_SIZE`
 * divided by this constant caps a chunk at 286 members).
 *
 * @internal
 */
export const COMBINED_COUNT_QUERY_MEMBER_SIZE = '"9999": count(*[_type == $c9999_type]),'.length

/**
 * Combines a set of count descriptors into one aggregate query. Each descriptor's type name
 * travels as an indexed param (`$c0_type`, `$c1_type`, ...) rather than query text, so it can
 * never collide with another descriptor's param or be misparsed as GROQ syntax. The projection is
 * keyed by the descriptor's index (`{"0": count(...), "1": count(...)}`), so results demux back by
 * position.
 *
 * @internal
 */
export function combineCountQuery(descriptors: CountDescriptor[]): CombinedCountQuery {
  const projections = descriptors
    .map((_descriptor, index) => `"${index}": count(*[_type == $c${index}_type])`)
    .join(',')

  const params: QueryParams = Object.fromEntries(
    descriptors.map((descriptor, index) => [`c${index}_type`, descriptor.type]),
  )

  return {query: `{${projections}}`, params}
}

/**
 * Reads the counts out of a combined query result, aligned to the descriptor order passed to
 * `combineCountQuery`. A missing or non-numeric entry resolves to `0`.
 *
 * @internal
 */
export function demuxCountResult(result: unknown, descriptorCount: number): number[] {
  const record =
    typeof result === 'object' && result !== null ? (result as Record<string, unknown>) : {}
  return Array.from({length: descriptorCount}, (_unused, index) => {
    const value = record[String(index)]
    return typeof value === 'number' ? value : 0
  })
}
