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

const publishedArchivedReleaseDocumentsCache: Record<string, BundleDocumentsObservableResult> =
  Object.create(null)

/**
 * @internal
 */
export function resetPublishedArchivedReleaseDocumentsCacheForTests(): void {
  for (const key of Object.keys(publishedArchivedReleaseDocumentsCache)) {
    delete publishedArchivedReleaseDocumentsCache[key]
  }
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
 * shared across subscribers, keyed by the dataset, release id and revision. A failed read is not
 * cached, so the next subscriber tries again.
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
  const cached = publishedArchivedReleaseDocumentsCache[cacheKey]
  if (cached) return cached

  const documents$: BundleDocumentsObservableResult =
    buildPublishedArchivedReleaseDocumentsObservable({client, release}).pipe(
      tap(({error}) => {
        if (error && publishedArchivedReleaseDocumentsCache[cacheKey] === documents$) {
          delete publishedArchivedReleaseDocumentsCache[cacheKey]
        }
      }),
      shareReplay(1),
    )
  publishedArchivedReleaseDocumentsCache[cacheKey] = documents$
  return documents$
}
