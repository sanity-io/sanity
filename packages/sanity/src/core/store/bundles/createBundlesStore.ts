import {type ListenEvent, type ListenOptions, type SanityClient} from '@sanity/client'
import {type Observable, of, share} from 'rxjs'

import {type BundleDocument, type BundlesStore} from './types'

export const SORT_FIELD = '_createdAt'
export const SORT_ORDER = 'desc'

const QUERY_FILTERS = [`_type == "bundle"`]

// TODO: Extend the projection with the fields needed
const QUERY_PROJECTION = `{
  ...,
}`

// Newest bundles first
const QUERY_SORT_ORDER = `order(${SORT_FIELD} ${SORT_ORDER})`

const QUERY = `*[${QUERY_FILTERS.join(' && ')}] ${QUERY_PROJECTION} | ${QUERY_SORT_ORDER}`

const LISTEN_OPTIONS: ListenOptions = {
  events: ['welcome', 'mutation', 'reconnect'],
  includeResult: true,
  visibility: 'query',
}

export function createBundlesStore(context: {client: SanityClient | null}): BundlesStore {
  const {client} = context
  function initialFetch(): Observable<BundleDocument[] | null> {
    if (!client) {
      return of(null) // emits null and completes if no client
    }
    return client.observable.fetch(QUERY).pipe(share())
  }

  function listener(): Observable<ListenEvent<Record<string, BundleDocument | null>>> {
    if (!client) return of()
    return client.observable.listen(QUERY, {}, LISTEN_OPTIONS).pipe(share())
  }
  return {initialFetch, listener}
}
