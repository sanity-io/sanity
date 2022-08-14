/* eslint-disable max-nested-callbacks */

import type {SanityClient} from '@sanity/client'
import {combineLatest, defer, from, Observable, of} from 'rxjs'
import {distinctUntilChanged, map, mergeMap, switchMap} from 'rxjs/operators'
import shallowEquals from 'shallow-equals'
import {flatten, keyBy} from 'lodash'
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

const MAX_DOCUMENT_ID_CHUNK_SIZE = 11164

/**
 * Takes an array of document IDs and puts them into individual chunks.
 * Because document IDs can vary greatly in size, we want to chunk by the length of the
 * combined comma-separated ID set. We try to stay within 11164 bytes - this is about the
 * same length the Sanity client uses for max query size, and accounts for rather large
 * headers to be present - so this _should_ be safe.
 *
 * @param documentIds - Unique document IDs to chunk
 * @returns Array of document ID chunks
 */
function chunkDocumentIds(documentIds: string[]): string[][] {
  let chunk: string[] = []
  let chunkSize = 0

  const chunks: string[][] = []

  for (const documentId of documentIds) {
    // Reached the max length? start a new chunk
    if (chunkSize + documentId.length + 1 >= MAX_DOCUMENT_ID_CHUNK_SIZE) {
      chunks.push(chunk)
      chunk = []
      chunkSize = 0
    }

    chunkSize += documentId.length + 1 // +1 is to account for a comma between IDs
    chunk.push(documentId)
  }

  if (!chunks.includes(chunk)) {
    chunks.push(chunk)
  }

  return chunks
}

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
    return from(chunkDocumentIds(uniqueIds)).pipe(
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
