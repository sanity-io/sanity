import {type ReleaseDocument} from '@sanity/client'
import {uuid} from '@sanity/uuid'
import {EMPTY, of} from 'rxjs'
import {
  catchError,
  delay,
  expand,
  finalize,
  map,
  reduce,
  shareReplay,
  switchMap,
} from 'rxjs/operators'

import {type useSource} from '../../../studio/source'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../../util/releasesClient'
import {type DocumentInRelease} from './types'
import {type BundleDocumentsObservableResult} from './useBundleDocuments'

const publishedArchivedReleaseDocumentsCache: Record<string, BundleDocumentsObservableResult> =
  Object.create(null)

/** Matches the active-release batch size used elsewhere in the release detail view. */
const HISTORY_BATCH_SIZE = 10
/**
 * Delay before each subsequent `/data/history` batch.
 * That endpoint is not CDN-cached and counts fully against the shared per-IP rate limit;
 * zero-gap sequential batches on large multi-locale releases can exhaust retries and 429.
 */
const HISTORY_BATCH_DELAY_MS = 100

const buildPublishedArchivedReleaseDocumentsObservable = ({
  getClient,
  release,
}: {
  getClient: ReturnType<typeof useSource>['getClient']
  release: ReleaseDocument
}): BundleDocumentsObservableResult => {
  const client = getClient(RELEASES_STUDIO_CLIENT_OPTIONS)
  const observableClient = client.observable
  const dataset = client.config().dataset

  if (!release.finalDocumentStates?.length) return of({loading: false, results: [], error: null})

  function batchRequestDocumentFromHistory(startIndex: number) {
    const finalIndex = startIndex + HISTORY_BATCH_SIZE
    return observableClient
      .request<{documents: DocumentInRelease['document'][]}>({
        url: `/data/history/${dataset}/documents/${release.finalDocumentStates
          ?.slice(startIndex, finalIndex)
          .map((d) => d.id)
          .join(',')}?lastRevision=true`,
      })
      .pipe(map(({documents}) => ({documents, finalIndex})))
  }

  const documents$ = batchRequestDocumentFromHistory(0).pipe(
    expand((response) => {
      if (release.finalDocumentStates && response.finalIndex < release.finalDocumentStates.length) {
        // Space subsequent batches (first batch is immediate), mirroring useBundleDocuments
        return of(null).pipe(
          delay(HISTORY_BATCH_DELAY_MS),
          switchMap(() => batchRequestDocumentFromHistory(response.finalIndex)),
        )
      }
      return EMPTY
    }),
    reduce(
      (documents: DocumentInRelease['document'][], batch) => documents.concat(batch.documents),
      [],
    ),
  )

  return documents$.pipe(
    map((documents) => ({
      loading: false,
      results: documents.map((document) => ({
        document,
        memoKey: uuid(),
        validation: {validation: [], hasError: false, isValidating: false},
      })),
      error: null,
    })),
    catchError((error) => {
      return of({loading: false, results: [], error})
    }),
  )
}

/**
 * Resolves the documents of a published or archived release from the history API.
 *
 * Published and archived releases no longer have live versioned documents, so their content is
 * reconstructed from the `finalDocumentStates` recorded on the release using the document history
 * endpoint. No validation or availability checks are performed.
 *
 * Published and archived releases are terminal states, so the result is cached and shared across
 * subscribers using a `<releaseId>-archived` cache key.
 *
 * @internal
 */
export const getPublishedArchivedReleaseDocumentsObservable = ({
  getClient,
  release,
}: {
  getClient: ReturnType<typeof useSource>['getClient']
  release: ReleaseDocument
}): BundleDocumentsObservableResult => {
  const cacheKey = `${getReleaseIdFromReleaseDocumentId(release._id)}-archived`

  if (!publishedArchivedReleaseDocumentsCache[cacheKey]) {
    publishedArchivedReleaseDocumentsCache[cacheKey] =
      buildPublishedArchivedReleaseDocumentsObservable({getClient, release}).pipe(
        finalize(() => {
          delete publishedArchivedReleaseDocumentsCache[cacheKey]
        }),
        shareReplay(1),
      )
  }

  return publishedArchivedReleaseDocumentsCache[cacheKey]
}
