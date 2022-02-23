import documentStore from 'part:@sanity/base/datastore/document'
import client from 'part:@sanity/base/client'
import {ClientError} from '@sanity/client'
import {
  createHookFromObservableFactory,
  getPublishedId,
  fetchAllCrossProjectTokens,
} from '@sanity/base/_internal'
import {Observable, timer, fromEvent, EMPTY, of} from 'rxjs'
import {
  map,
  startWith,
  distinctUntilChanged,
  switchMap,
  shareReplay,
  catchError,
} from 'rxjs/operators'

// this is used in place of `instanceof` so the matching can be more robust
function isClientError(e: unknown): e is ClientError {
  if (typeof e !== 'object') return false
  if (!e) return false
  return 'statusCode' in e && 'response' in e
}

const versionedClient = client.withConfig({
  apiVersion: '2022-03-07',
})

const POLL_INTERVAL = 5000

// only fetches when the document is visible
const visiblePoll$ = fromEvent(document, 'visibilitychange').pipe(
  // add empty emission to have this fire on creation
  startWith(null),
  map(() => document.visibilityState === 'visible'),
  distinctUntilChanged(),
  switchMap((visible) =>
    visible
      ? // using timer instead of interval since timer will emit on creation
        timer(0, POLL_INTERVAL)
      : EMPTY
  ),
  shareReplay({refCount: true, bufferSize: 1})
)

export type ReferringDocuments = {
  isLoading: boolean
  totalCount: number
  internalReferences?: {
    totalCount: number
    references: Array<{_id: string; _type: string}>
  }
  crossDatasetReferences?: {
    totalCount: number
    references: Array<{documentId: string; projectId: string; datasetName: string}>
  }
}

/**
 * fetches the cross-dataset references using the client observable.request
 * method (for that requests can be automatically cancelled)
 */
function fetchCrossDatasetReferences(
  documentId: string
): Observable<ReferringDocuments['crossDatasetReferences']> {
  return visiblePoll$.pipe(
    switchMap(() => fetchAllCrossProjectTokens()),
    switchMap((crossProjectTokens) => {
      const currentDataset = client.config().dataset
      const headers: Record<string, string> =
        crossProjectTokens.length > 0
          ? {
              'sanity-project-tokens': crossProjectTokens
                .map((t) => `${t.projectId}=${t.token}`)
                .join(','),
            }
          : {}

      return versionedClient.observable
        .request({
          url: `/data/references/${currentDataset}/documents/${documentId}/to?excludeInternalReferences=true&excludePaths=true`,
          headers,
        })
        .pipe(
          catchError((e) => {
            // it's possible that referencing document doesn't exist yet so the
            // API will return a 404. In those cases, we want to catch and return
            // a response with no references
            if (isClientError(e) && e.statusCode === 404) {
              return of({totalCount: 0, references: []})
            }

            throw e
          })
        )
    })
  )
}

const useInternalReferences = createHookFromObservableFactory((documentId: string) => {
  const referencesClause = '*[references($documentId)][0...100]{_id,_type}'
  const totalClause = 'count(*[references($documentId)])'

  return documentStore.listenQuery(
    `{"references":${referencesClause},"totalCount":${totalClause}}`,
    {documentId},
    {tag: 'use-referring-documents'}
  ) as Observable<ReferringDocuments['internalReferences']>
})

const useCrossDatasetReferences = createHookFromObservableFactory((documentId: string) => {
  return visiblePoll$.pipe(switchMap(() => fetchCrossDatasetReferences(documentId)))
})

export function useReferringDocuments(documentId: string): ReferringDocuments {
  const publishedId = getPublishedId(documentId)
  const [internalReferences, isInternalReferencesLoading] = useInternalReferences(publishedId)
  const [crossDatasetReferences, isCrossDatasetReferencesLoading] = useCrossDatasetReferences(
    publishedId
  )

  return {
    totalCount: (internalReferences?.totalCount || 0) + (crossDatasetReferences?.totalCount || 0),
    internalReferences,
    crossDatasetReferences,
    isLoading: isInternalReferencesLoading || isCrossDatasetReferencesLoading,
  }
}
