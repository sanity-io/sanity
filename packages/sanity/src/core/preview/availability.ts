import {type SanityClient} from '@sanity/client'
import {flatten, keyBy} from 'lodash'
import {combineLatest, defer, from, type Observable, of} from 'rxjs'
import {distinctUntilChanged, map, mergeMap, reduce, switchMap} from 'rxjs/operators'
import shallowEquals from 'shallow-equals'

import {createSWR, getDraftId, getPublishedId, getVersionId, isRecord} from '../util'
import {
  AVAILABILITY_NOT_FOUND,
  AVAILABILITY_PERMISSION_DENIED,
  AVAILABILITY_READABLE,
  AVAILABILITY_VERSION_DELETED,
} from './constants'
import {
  type AvailabilityResponse,
  type DocumentAvailability,
  type DraftsModelDocumentAvailability,
  type ObservePathsFn,
} from './types'
import {debounceCollect} from './utils/debounceCollect'

const MAX_DOCUMENT_ID_CHUNK_SIZE = 11164

/**
 * Create an SWR operator for document availability
 */
const swr = createSWR<DocumentAvailability>({maxSize: 1000})

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

/**
 * Mutative concat
 * @param array - the array to concat to
 * @param chunks - the items to concat to the array
 */
function mutConcat<T>(array: T[], chunks: T[]) {
  array.push(...chunks)
  return array
}

export function createPreviewAvailabilityObserver(
  versionedClient: SanityClient,
  observePaths: ObservePathsFn,
): (id: string) => Observable<DraftsModelDocumentAvailability> {
  /**
   * Observable of metadata for the document with the given id
   * If we can't read a document it is either because it's not readable or because it doesn't exist
   *
   * @internal
   */
  function observeDocumentAvailability(id: string): Observable<DocumentAvailability> {
    // check for existence
    return observePaths({_ref: id}, [['_rev'], ['_system']]).pipe(
      map((res) => ({
        hasRev: isRecord(res) && Boolean('_rev' in res && res?._rev),
        isDeleted: isRecord(res) && res._system?.delete === true,
      })),
      distinctUntilChanged(),
      switchMap(({hasRev, isDeleted}) => {
        if (isDeleted) {
          return of(AVAILABILITY_VERSION_DELETED)
        }

        return hasRev
          ? // short circuit: if we can read the _rev field we know it both exists and is readable
            of(AVAILABILITY_READABLE)
          : // we can't read the _rev field for two possible reasons: 1) the document isn't readable or 2) the document doesn't exist
            fetchDocumentReadability(id)
      }),
      swr(id),
      map((ev) => ev.value),
    )
  }

  const fetchDocumentReadability = debounceCollect(function fetchDocumentReadability(
    args: string[][],
  ): Observable<DocumentAvailability[]> {
    const uniqueIds = [...new Set(flatten(args))]
    return from(chunkDocumentIds(uniqueIds)).pipe(
      mergeMap(fetchDocumentReadabilityChunked, 10),
      reduce<DocumentAvailability[], DocumentAvailability[]>(mutConcat, []),
      map((res) => args.map(([id]) => res[uniqueIds.indexOf(id)])),
    )
  }, 1)

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
        }),
      )
    })
  }

  /**
   * Returns an observable of metadata for a given drafts model document
   */
  return function observeDocumentPairAvailability(
    id: string,
    {version}: {version?: string} = {},
  ): Observable<DraftsModelDocumentAvailability> {
    const draftId = getDraftId(id)
    const publishedId = getPublishedId(id)
    const versionId = version ? getVersionId(id, version) : undefined
    return combineLatest([
      observeDocumentAvailability(draftId),
      observeDocumentAvailability(publishedId),
      ...(versionId ? [observeDocumentAvailability(versionId)] : []),
    ]).pipe(
      distinctUntilChanged(shallowEquals),
      map(([draftReadability, publishedReadability, versionReadability]) => {
        return {
          draft: draftReadability,
          published: publishedReadability,
          ...(versionReadability
            ? {
                version: versionReadability,
              }
            : {}),
        }
      }),
    )
  }
}
