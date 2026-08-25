import {type SanityClient} from '@sanity/client'
import {ConcurrencyLimiter} from '@sanity/util/concurrency-limiter'
import {
  bufferTime,
  defer,
  filter,
  finalize,
  from,
  map,
  mergeMap,
  share,
  Subject,
  switchMap,
} from 'rxjs'

import {getAbortReason, throwIfAborted} from '../abortSignal'

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
  const id$ = new Subject<{id: string; signal?: AbortSignal}>()
  const limiter = new ConcurrencyLimiter(MAX_REQUEST_CONCURRENCY)

  const existence$ = id$.pipe(
    bufferTime(BUFFER_TIME, null, MAX_BUFFER_SIZE),
    mergeMap((entries) => {
      const groups = new Map<AbortSignal | undefined, Set<string>>()
      for (const {id, signal} of entries) {
        const ids = groups.get(signal) || new Set<string>()
        ids.add(id)
        groups.set(signal, ids)
      }
      return from(Array.from(groups, ([signal, ids]) => ({ids: Array.from(ids), signal})))
    }),
    mergeMap(({ids, signal}) =>
      from(limiter.ready(signal)).pipe(
        switchMap(() =>
          defer(() => {
            throwIfAborted(signal)
            return client.observable.request<AvailabilityResponse>({
              url: client.getDataUrl('doc', ids.join(',')),
              query: {excludeContent: 'true'},
              signal,
              tag: 'documents-availability',
            })
          }).pipe(
            map((availability) => ({availability, ids, signal})),
            finalize(limiter.release),
          ),
        ),
      ),
    ),
    mergeMap(({availability, ids, signal}) =>
      ids.map((id) => {
        const omittedIds = availability.omitted.reduce<Record<string, 'existence' | 'permission'>>(
          (acc, next) => {
            acc[next.id] = next.reason
            return acc
          },
          {},
        )

        // if not in the `omitted`, then it exists
        if (!omittedIds[id]) return {id, exists: true, signal}
        // if in the `omitted` due to existence, then it does not exist
        if (omittedIds[id] === 'existence') return {id, exists: false, signal}
        // otherwise, it must exist
        return {id, exists: true, signal}
      }),
    ),
    share(),
  )

  return function getDocumentExists(options) {
    const signal = options.signal || defaultSignal
    return new Promise<boolean>((resolve, reject) => {
      const onAbort = () => {
        if (!signal) return
        subscription.unsubscribe()
        reject(getAbortReason(signal))
      }
      const subscription = existence$
        .pipe(filter(({id, signal: resultSignal}) => id === options.id && resultSignal === signal))
        .subscribe({
          error: (error) => {
            signal?.removeEventListener('abort', onAbort)
            reject(error)
          },
          next: ({exists}) => {
            signal?.removeEventListener('abort', onAbort)
            subscription.unsubscribe()
            resolve(exists)
          },
        })

      if (signal?.aborted) {
        onAbort()
        return
      }
      signal?.addEventListener('abort', onAbort, {once: true})
      id$.next({id: options.id, signal})
    })
  }
}
