/* eslint-disable max-nested-callbacks */
import {combineLatest, defer, from, Observable, of, forkJoin} from 'rxjs'
import {distinctUntilChanged, map, mergeMap, switchMap, concatMap} from 'rxjs/operators'
import shallowEquals from 'shallow-equals'
import {chunk, flatten, keyBy} from 'lodash'
import {getDraftId, getPublishedId} from '../util/draftUtils'
import {versionedClient} from '../client/versionedClient'
import type {
  AvailabilityResponse,
  DocumentAvailability,
  DraftsModelDocumentAvailability,
} from './types'
import {debounceCollect} from './utils/debounceCollect'
import {
  AVAILABILITY_NOT_FOUND,
  AVAILABILITY_PERMISSION_DENIED,
  AVAILABILITY_READABLE,
} from './constants'
import {observePaths} from './'

/**
 * Returns an observable of metadata for a given drafts model document
 * @param id document id
 */
export function observeDocumentPairAvailability(
  id: string
): Observable<DraftsModelDocumentAvailability> {
  const draftId = getDraftId(id)
  const publishedId = getPublishedId(id)
  return combineLatest([
    observeDocumentAvailability(draftId),
    observeDocumentAvailability(publishedId),
  ]).pipe(
    distinctUntilChanged(shallowEquals),
    map(([draftReadability, publishedReadability]) => {
      return {
        draft: draftReadability,
        published: publishedReadability,
      }
    })
  )
}

/**
 * Observable of metadata for the document with the given id
 * If we can't read a document it is either because it's not readable or because it doesn't exist
 * @param id
 * @internal
 */
function observeDocumentAvailability(id: string): Observable<DocumentAvailability> {
  // check for existence
  return observePaths(id, [['_rev']]).pipe(
    map((res) => Boolean(res?._rev)),
    distinctUntilChanged(),
    switchMap((hasRev) => {
      return hasRev
        ? // short circuit: if we can read the _rev field we know it both exists and is readable
          of(AVAILABILITY_READABLE)
        : // we can't read the _rev field for two possible reasons: 1) the document isn't readable or 2) the document doesn't exist
          fetchDocumentReadability(id)
    })
  )
}

const fetchDocumentReadability = debounceCollect(function fetchDocumentReadability(
  args: string[][]
): Observable<DocumentAvailability[]> {
  const uniqueIds = [...new Set(flatten(args))]
  return from(chunk(uniqueIds, 300)).pipe(
    mergeMap(fetchDocumentReadabilityChunked, 10),
    map((res) => args.map(([id]) => res[uniqueIds.indexOf(id)]))
  )
},
1)

function fetchDocumentReadabilityChunked(ids: string[]): Observable<DocumentAvailability[]> {
  const chunkSize = Math.round(ids.join(',').length / 1024) // Max url length is 2048, use 1024 here to leave some extra room for the other stuff in the URL
  const chunks = chunkSize > 1 ? chunk(ids, chunkSize) : [ids]
  return defer(() => {
    const observables = chunks.map((_chunk) => {
      const requestOptions = {
        uri: versionedClient.getDataUrl('doc', _chunk.join(',')),
        json: true,
        query: {excludeContent: 'true'},
        tag: 'preview.documents-availability',
      }
      return versionedClient.observable.request<AvailabilityResponse>(requestOptions)
    })
    return forkJoin(observables).pipe(
      concatMap((responses) => {
        return responses.map((response) => {
          const omitted = keyBy(response.omitted || [], (entry) => entry.id)
          return ids.map((id) => {
            const omittedEntry = omitted[id]
            if (!omittedEntry) {
              // it's not omitted, so it exists and is readable
              return AVAILABILITY_READABLE
            }
            if (omittedEntry.reason === 'existence') {
              return AVAILABILITY_NOT_FOUND
            }
            if (omittedEntry.reason === 'permission') {
              // it's not omitted, so it exists and is readable
              return AVAILABILITY_PERMISSION_DENIED
            }
            throw new Error(`Unexpected reason for omission: "${omittedEntry.reason}"`)
          })
        })
      })
    )
  })
}
