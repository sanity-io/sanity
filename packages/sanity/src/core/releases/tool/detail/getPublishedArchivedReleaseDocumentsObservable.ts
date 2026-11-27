import {type ReleaseDocument, type SanityClient} from '@sanity/client'
import {uuid} from '@sanity/uuid'
import {of} from 'rxjs'
import {catchError, map, shareReplay, tap} from 'rxjs/operators'

import {loadLastRevisionDocuments} from '../../../store/history/lastRevisionDocumentsLoader'
import {type useSource} from '../../../studio/source'
import {isNonNullable} from '../../../util/isNonNullable'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../../util/releasesClient'
import {type DocumentInRelease} from './types'
import {type BundleDocumentsObservableResult} from './useBundleDocuments'

/**
 * How many releases the session cache keeps, dropping the least recently used first. Above the
 * length of the archived lists seen so far, so scrolling one back up reads nothing again.
 *
 * @internal
 */
export const MAX_CACHED_RELEASES = 200

// In least recently used order: a read moves its release to the end
const publishedArchivedReleaseDocumentsCache = new Map<string, BundleDocumentsObservableResult>()

/**
 * @internal
 */
export function resetPublishedArchivedReleaseDocumentsCacheForTests(): void {
  publishedArchivedReleaseDocumentsCache.clear()
}

const buildPublishedArchivedReleaseDocumentsObservable = ({
  client,
  release,
}: {
  client: SanityClient
  release: ReleaseDocument
}): BundleDocumentsObservableResult => {
  const documentIds = release.finalDocumentStates?.map(({id}) => id) ?? []
  if (!documentIds.length) return of({loading: false, results: [], error: null})

  return loadLastRevisionDocuments(client, documentIds).pipe(
    map((documents) => ({
      loading: false,
      results: documents.filter(isNonNullable).map((document) => ({
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a revision read from history has none of the existence flags of a live release document
        document: document as DocumentInRelease['document'],
        memoKey: uuid(),
        validation: {validation: [], hasError: false, isValidating: false},
      })),
      error: null,
    })),
    catchError((error) => of({loading: false, results: [], error})),
  )
}

/**
 * Resolves the documents of a published or archived release from the history API.
 *
 * Published and archived releases no longer have live versioned documents, so their content is
 * reconstructed from the `finalDocumentStates` recorded on the release, using the last revision of
 * each document in history. The reads of every release on screen are batched together, see
 * {@link loadLastRevisionDocuments}. No validation or availability checks are performed.
 *
 * Published and archived releases are terminal states, so the result is cached for the session and
 * shared across subscribers, keyed by the dataset, release id and revision, for the
 * {@link MAX_CACHED_RELEASES} most recently read releases. A failed read is not cached, so the next
 * subscriber tries again.
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
  const client = getClient(RELEASES_STUDIO_CLIENT_OPTIONS)
  // The same release id can exist in another dataset of the studio. An archived release that is
  // restored and archived again has a new revision, and its documents a new last revision
  const cacheKey = `${client.config().dataset}-${getReleaseIdFromReleaseDocumentId(release._id)}-${release._rev}`
  const cached = publishedArchivedReleaseDocumentsCache.get(cacheKey)
  if (cached) {
    publishedArchivedReleaseDocumentsCache.delete(cacheKey)
    publishedArchivedReleaseDocumentsCache.set(cacheKey, cached)
    return cached
  }

  const documents$: BundleDocumentsObservableResult =
    buildPublishedArchivedReleaseDocumentsObservable({client, release}).pipe(
      tap(({error}) => {
        if (error && publishedArchivedReleaseDocumentsCache.get(cacheKey) === documents$) {
          publishedArchivedReleaseDocumentsCache.delete(cacheKey)
        }
      }),
      shareReplay(1),
    )
  publishedArchivedReleaseDocumentsCache.set(cacheKey, documents$)
  if (publishedArchivedReleaseDocumentsCache.size > MAX_CACHED_RELEASES) {
    const [leastRecentlyUsed] = publishedArchivedReleaseDocumentsCache.keys()
    publishedArchivedReleaseDocumentsCache.delete(leastRecentlyUsed)
  }
  return documents$
}
