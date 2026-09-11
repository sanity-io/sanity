import {type QueryParams} from '@sanity/client'

/** A single count request: a groq filter and the params its `$token`s resolve against. */
export interface CountDescriptor {
  filter: string
  params: Record<string, unknown>
}

/** One aggregate query counting every descriptor, keyed by the descriptor's index. */
export interface CombinedCountQuery {
  query: string
  params: QueryParams
}

const GROQ_PARAM_TOKEN = /\$([a-zA-Z_][a-zA-Z0-9_]*)/g

interface NamespacedDescriptor {
  filter: string
  params: QueryParams
}

function namespaceDescriptor(descriptor: CountDescriptor, index: number): NamespacedDescriptor {
  const prefix = `c${index}_`

  return {
    filter: descriptor.filter.replace(GROQ_PARAM_TOKEN, `$$${prefix}$1`),
    params: Object.fromEntries(
      Object.entries(descriptor.params).map(([key, value]) => [`${prefix}${key}`, value]),
    ),
  }
}

/**
 * Combines a set of count descriptors into one aggregate query. Each descriptor's params are
 * namespaced by its index (`$type` becomes `$c0_type`) so independent descriptors never collide
 * in the shared params object, and the projection is keyed by the descriptor's index
 * (`{"0": count(...), "1": count(...)}`), so results demux back by position.
 *
 * @internal
 */
export function combineCountQuery(descriptors: CountDescriptor[]): CombinedCountQuery {
  const namespaced = descriptors.map(namespaceDescriptor)

  const projections = namespaced
    .map(({filter}, index) => `"${index}": count(*[${filter}])`)
    .join(',')

  const params: QueryParams = Object.fromEntries(
    namespaced.flatMap(({params: descriptorParams}) => Object.entries(descriptorParams)),
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
