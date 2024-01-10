import type {SanityClient} from '@sanity/client'
import {Subject, bufferTime, filter, map, mergeMap, firstValueFrom, share} from 'rxjs'
import {AvailabilityResponse} from '../../preview'

export function createBatchedGetDocumentExists(
  client: SanityClient,
): (options: {id: string}) => Promise<boolean> {
  const id$ = new Subject<string>()

  const existence$ = id$.pipe(
    bufferTime(25), // allows multiple IDs to be batched
    map((ids) => Array.from(new Set(ids))),
    mergeMap((ids) =>
      client.observable
        .request<AvailabilityResponse>({
          uri: client.getDataUrl('doc', ids.join(',')),
          json: true,
          query: {excludeContent: 'true'},
          tag: 'validation.documents-availability',
        })
        .pipe(map((availability) => ({availability, ids}))),
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
        // if in the `omitted` due to permissions, then it exists
        if (omittedIds[id] === 'permission') return {id, exists: true}
        // otherwise, it must exist
        return {id, exists: false}
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
