import {type SanityClient} from '@sanity/client'
import {ConcurrencyLimiter} from '@sanity/util/concurrency-limiter'
import {
  bufferTime,
  filter,
  finalize,
  firstValueFrom,
  from,
  map,
  mergeMap,
  share,
  Subject,
  switchMap,
} from 'rxjs'

import {type AvailabilityResponse} from '../../preview'

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
): (options: {id: string}) => Promise<boolean> {
  const id$ = new Subject<string>()
  const limiter = new ConcurrencyLimiter(MAX_REQUEST_CONCURRENCY)

  const existence$ = id$.pipe(
    bufferTime(BUFFER_TIME, null, MAX_BUFFER_SIZE),
    map((ids) => Array.from(new Set(ids))),
    mergeMap((ids) =>
      from(limiter.ready()).pipe(
        switchMap(() =>
          client.observable
            .request<AvailabilityResponse>({
              uri: client.getDataUrl('doc', ids.join(',')),
              json: true,
              query: {excludeContent: 'true'},
              tag: 'documents-availability',
            })
            .pipe(map((availability) => ({availability, ids}))),
        ),
        finalize(limiter.release),
      ),
    ),
    mergeMap(({availability, ids}) =>
      ids.map((id) => {
        const omittedIds = availability.omitted.reduce<Record<string, 'existence' | 'permission'>>(
          (acc, next) => {
            acc[next.id] = next.reason
            return acc
          },
          {},
        )

        // if not in the `omitted`, then it exists
        if (!omittedIds[id]) return {id, exists: true}
        // if in the `omitted` due to existence, then it does not exist
        if (omittedIds[id] === 'existence') return {id, exists: false}
        // otherwise, it must exist
        return {id, exists: true}
      }),
    ),
    share(),
  )

  return async function getDocumentExists(options) {
    // set up a promise/listener that waits for the result
    const result = firstValueFrom(existence$.pipe(filter(({id}) => id === options.id)))
    // send off the request to the stream for batching
    id$.next(options.id)

    const {exists} = await result
    return exists
  }
}
