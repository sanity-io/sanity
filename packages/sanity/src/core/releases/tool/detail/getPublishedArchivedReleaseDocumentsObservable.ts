import {type ReleaseDocument} from '@sanity/client'
import {uuid} from '@sanity/uuid'
import {of} from 'rxjs'
import {catchError, expand, finalize, map, reduce, shareReplay} from 'rxjs/operators'

import {type useSource} from '../../../studio'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../../util/releasesClient'
import {type BundleDocumentsObservableResult, type DocumentInRelease} from './useBundleDocuments'

const publishedArchivedReleaseDocumentsCache: Record<string, BundleDocumentsObservableResult> =
  Object.create(null)

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
    const finalIndex = startIndex + 10
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
        // Continue with next batch
        return batchRequestDocumentFromHistory(response.finalIndex)
      }
      // End recursion by emitting an empty observable
      return of()
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
