import {type ListenQueryParams} from 'sanity'

import {type ListItemCount} from '../../structureBuilder/ListItem'

/** A list item paired with the query descriptor used to count its documents. */
export interface ListPaneCountDescriptor {
  id: string
  count: ListItemCount
}

/** The batched fetch + listen queries and merged params for a set of list item counts. */
export interface ListPaneCountsQuery {
  fetch: string
  listen: string
  params: ListenQueryParams
}

const GROQ_PARAM_TOKEN = /\$([a-zA-Z_][a-zA-Z0-9_]*)/g

function coerceParamValue(value: unknown): ListenQueryParams[string] {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value
  }

  if (Array.isArray(value) && value.every((entry) => typeof entry === 'string')) {
    return value as string[]
  }

  return String(value)
}

interface NamespacedDescriptor {
  id: string
  filter: string
  params: ListenQueryParams
}

function namespaceDescriptor(
  descriptor: ListPaneCountDescriptor,
  index: number,
): NamespacedDescriptor {
  const prefix = `c${index}_`

  // count.apiVersion is intentionally not honored: the whole batch runs under the studio
  // client's default apiVersion, and count filters don't depend on apiVersion semantics.
  const filter = descriptor.count.filter.replace(GROQ_PARAM_TOKEN, `$$${prefix}$1`)

  const params = Object.fromEntries(
    Object.entries(descriptor.count.params).map(([key, value]) => [
      `${prefix}${key}`,
      coerceParamValue(value),
    ]),
  )

  return {id: descriptor.id, filter, params}
}

/**
 * Builds one aggregate count query for a set of list items, plus a single listen filter
 * covering all of them. Each item's params are namespaced by its index (`$type` becomes
 * `$c0_type`) so independent items never collide in the shared params object. Ordering
 * follows the input order.
 *
 * @internal
 */
export function buildListPaneCountsQuery(
  descriptors: ListPaneCountDescriptor[],
): ListPaneCountsQuery {
  const namespaced = descriptors.map(namespaceDescriptor)

  const projections = namespaced
    .map(({id, filter}) => `${JSON.stringify(id)}: count(*[${filter}])`)
    .join(',')

  const listenFilter = namespaced.map(({filter}) => `(${filter})`).join(' || ')

  const params = namespaced.reduce<ListenQueryParams>(
    (merged, descriptor) => ({...merged, ...descriptor.params}),
    {},
  )

  return {
    fetch: `{${projections}}`,
    listen: `*[${listenFilter}]`,
    params,
  }
}
