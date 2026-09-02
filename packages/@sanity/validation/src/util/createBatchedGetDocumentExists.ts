import {type SanityClient} from '@sanity/client'
import {bufferTime, filter, firstValueFrom, map, mergeMap, share, Subject} from 'rxjs'

import {cancelWith} from '../abortSignal'

interface AvailabilityResponse {
  omitted: {id: string; reason: 'existence' | 'permission'}[]
}

/**
 * The amount of time reserved for waiting for new IDs.
 */
const BUFFER_TIME = 250
/**
 * The upper limit for IDs sent to the `doc` endpoint at once. From some manual
 * testing, 100 seems to be a safe amount.
 */
export const MAX_BUFFER_SIZE = 100
/**
 * The max amount of inflight requests to the `doc` endpoint to check for
 * availability. Currently set to 1 because the endpoint is expensive
 *
 * From: https://www.sanity.io/docs/http-doc
 *
 * "it is less scalable/performant than the other query-mechanisms, so should
 * be used sparingly*
 */
export const MAX_REQUEST_CONCURRENCY = 1

export function createBatchedGetDocumentExists(
  client: SanityClient,
  defaultSignal?: AbortSignal,
): (options: {id: string; signal?: AbortSignal}) => Promise<boolean> {
  const id$ = new Subject<string>()

  const existence$ = id$.pipe(
    bufferTime(BUFFER_TIME, null, MAX_BUFFER_SIZE),
    map((ids) => Array.from(new Set(ids))),
    filter((ids) => ids.length > 0),
    mergeMap(
      (ids) =>
        client.observable
          .request<AvailabilityResponse>({
            url: client.getDataUrl('doc', ids.join(',')),
            query: {excludeContent: 'true'},
            signal: defaultSignal,
            tag: 'documents-availability',
          })
          .pipe(map((availability) => ({availability, ids}))),
      MAX_REQUEST_CONCURRENCY,
    ),
    mergeMap(({availability, ids}) => {
      const missingIds = new Set(
        availability.omitted.filter(({reason}) => reason === 'existence').map(({id}) => id),
      )
      return ids.map((id) => ({id, exists: !missingIds.has(id)}))
    }),
    share(),
  )

  return async function getDocumentExists(options) {
    const signal = options.signal || defaultSignal
    signal?.throwIfAborted()

    const result = firstValueFrom(
      existence$.pipe(
        filter(({id}) => id === options.id),
        map(({exists}) => exists),
        cancelWith(signal),
      ),
    )

    id$.next(options.id)
    return result
  }
}
