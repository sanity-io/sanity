/* eslint-disable max-nested-callbacks */

import type {SanityClient} from '@sanity/client'
import {combineLatest, defer, from, Observable, of} from 'rxjs'
import {distinctUntilChanged, map, mergeMap, switchMap} from 'rxjs/operators'
import shallowEquals from 'shallow-equals'
import {chunk, flatten, keyBy} from 'lodash'
import {isRecord} from '../util/isRecord'
import {getDraftId, getPublishedId} from '../util/draftUtils'
import type {
  AvailabilityResponse,
  DocumentAvailability,
  DraftsModelDocumentAvailability,
  Previewable,
} from './types'
import {debounceCollect} from './utils/debounceCollect'
import {
  AVAILABILITY_NOT_FOUND,
  AVAILABILITY_PERMISSION_DENIED,
  AVAILABILITY_READABLE,
} from './constants'
import {ObservePathsFn} from './types'

export function create_preview_availability(
  versionedClient: SanityClient,
  observePaths: ObservePathsFn
): {
  observeDocumentPairAvailability(value: Previewable): Observable<DraftsModelDocumentAvailability>
} {
  /**
   * Returns an observable of metadata for a given drafts model document
   */
  function observeDocumentPairAvailability(
    value: Previewable
  ): Observable<DraftsModelDocumentAvailability> {
    const draftId = getDraftId('_id' in value ? value._id : value._ref)
    const publishedId = getPublishedId('_id' in value ? value._id : value._ref)
    return combineLatest([
      observeDocumentAvailability({_type: 'reference', _ref: draftId}),
      observeDocumentAvailability({_type: 'reference', _ref: publishedId}),
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
   *
   * @internal
   */
  function observeDocumentAvailability(value: Previewable): Observable<DocumentAvailability> {
    const id = '_id' in value ? value._id : value._ref

    // check for existence
    return observePaths(value, [['_rev']]).pipe(
      map((res) => isRecord(res) && Boolean('_rev' in res && res?._rev)),
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
    return defer(() => {
      const requestOptions = {
        uri: versionedClient.getDataUrl('doc', ids.join(',')),
        json: true,
        query: {excludeContent: 'true'},
        tag: 'preview.documents-availability',
      }
      return versionedClient.observable.request<AvailabilityResponse>(requestOptions).pipe(
        map((response) => {
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
      )
    })
  }

  return {observeDocumentPairAvailability}
}
