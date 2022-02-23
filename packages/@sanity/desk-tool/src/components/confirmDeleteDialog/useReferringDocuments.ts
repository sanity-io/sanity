import documentStore from 'part:@sanity/base/datastore/document'
import client from 'part:@sanity/base/client'
import {ClientError} from '@sanity/client'
import {createHookFromObservableFactory, getPublishedId} from '@sanity/base/_internal'
import {Observable, timer, fromEvent, EMPTY, from, of} from 'rxjs'
import {
  map,
  startWith,
  distinctUntilChanged,
  switchMap,
  shareReplay,
  filter,
  mergeMap,
  toArray,
  catchError,
} from 'rxjs/operators'

const TOKEN_DOCUMENT_ID_BASE = `secrets.sanity.sharedContent`

function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null
}

// this is used in place of `instanceof` so the matching can be more robust
function isClientError(e: unknown): e is ClientError {
  if (typeof e !== 'object') return false
  if (!e) return false
  return 'statusCode' in e && 'response' in e
}

const versionedClient = client.withConfig({
  apiVersion: 'X', // TODO: replace with named API version
})

function getProjectIdFromTokenDocumentId(id: string): null | string {
  if (!id.startsWith(TOKEN_DOCUMENT_ID_BASE)) {
    return null
  }
  //prettier-ignore
  const [/*secrets*/, /*sanity*/, /*sharedContent*/, projectId] = id.split('.')
  return projectId
}

function fetchCrossDatasetTokens(): Observable<
  {
    projectId: string
    token: string
  }[]
> {
  return versionedClient.observable
    .fetch(`*[_id in path("secrets.sanity.sharedContent.**")]{_id, _type, _updatedAt, token}`)
    .pipe(
      mergeMap((tokenDocs: {_id: string; token: string}[]) => from(tokenDocs)),
      map((doc) => {
        const projectId = getProjectIdFromTokenDocumentId(doc._id)
        return projectId ? {projectId, token: doc.token} : null
      }),
      filter(isNonNullable),
      toArray()
    )
}

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
    switchMap(() => fetchCrossDatasetTokens()),
    switchMap((crossDatasetTokens) => {
      const currentDataset = client.config().dataset

      return versionedClient.observable
        .request({
          url: `/data/references/${currentDataset}/documents/${documentId}/to?excludeInternalReferences=true&excludePaths=true`,
          ...(crossDatasetTokens.length > 0
            ? {
                'sanity-project-tokens': crossDatasetTokens
                  .map((t) => `${t.projectId}=${t.token}`)
                  .join(','),
              }
            : null),
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
