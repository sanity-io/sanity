import {type ReleaseDocument, type SanityClient} from '@sanity/client'
import {uuid} from '@sanity/uuid'
import QuickLRU from 'quick-lru'
import {catchError, map, type Observable, of, shareReplay, tap} from 'rxjs'

import {type useSource} from '../../../studio/source'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../../util/releasesClient'
import {createHistoryLastRevisionLoader} from './createHistoryLastRevisionLoader'
import {type DocumentInRelease} from './types'
import {type BundleDocumentsObservableResult} from './useBundleDocuments'

type HistoryDocument = DocumentInRelease['document']

interface ClientCache {
  loadLastRevisions: (ids: string[]) => Observable<HistoryDocument[]>
  results: QuickLRU<string, BundleDocumentsObservableResult>
}

const MAX_CACHED_RELEASES = 100
const FAILED_RESULT_RETENTION_MS = 30_000

const cacheByClient = new WeakMap<SanityClient, ClientCache>()

function getClientCache(client: SanityClient): ClientCache {
  const existingCache = cacheByClient.get(client)
  if (existingCache) return existingCache

  const createdCache: ClientCache = {
    loadLastRevisions: createHistoryLastRevisionLoader(client),
    results: new QuickLRU({maxSize: MAX_CACHED_RELEASES}),
  }
  cacheByClient.set(client, createdCache)
  return createdCache
}

function forgetFailedResultLater(
  results: ClientCache['results'],
  cacheKey: string,
  result$: BundleDocumentsObservableResult,
): void {
  setTimeout(() => {
    if (results.get(cacheKey) === result$) results.delete(cacheKey)
  }, FAILED_RESULT_RETENTION_MS)
}

/**
 * Resolves the documents of a published or archived release from the history API.
 *
 * Published and archived releases no longer have live versioned documents, so their content is
 * reconstructed from the `finalDocumentStates` recorded on the release using the document history
 * endpoint. No validation or availability checks are performed.
 *
 * Results are cached per release revision, so a remount reuses them and a re-archived release is
 * fetched again.
 *
 * @internal
 */
export const getPublishedArchivedReleaseDocumentsObservable = ({
  getClient,
  release,
}: {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  getClient: ReturnType<typeof useSource>['getClient']
  release: ReleaseDocument
}): BundleDocumentsObservableResult => {
  const documentIds = release.finalDocumentStates?.map((documentState) => documentState.id) ?? []
  if (documentIds.length === 0) return of({loading: false, results: [], error: null})

  const {loadLastRevisions, results} = getClientCache(getClient(RELEASES_STUDIO_CLIENT_OPTIONS))
  const cacheKey = `${getReleaseIdFromReleaseDocumentId(release._id)}:${release._rev}`

  const cachedResult$ = results.get(cacheKey)
  if (cachedResult$) return cachedResult$

  const result$: BundleDocumentsObservableResult = loadLastRevisions(documentIds).pipe(
    map((documents) => ({
      loading: false,
      results: documents.map((document) => ({
        document,
        memoKey: uuid(),
        validation: {validation: [], hasError: false, isValidating: false},
      })),
      error: null,
    })),
    catchError((error: Error) => of({loading: false, results: [], error})),
    tap((result) => {
      if (result.error) forgetFailedResultLater(results, cacheKey, result$)
    }),
    // The source always completes, and finishing after the last subscriber leaves fills the cache.
    shareReplay({bufferSize: 1, refCount: false}),
  )

  results.set(cacheKey, result$)
  return result$
}
