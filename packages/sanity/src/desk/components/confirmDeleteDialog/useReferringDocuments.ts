import {useMemo} from 'react'
import {ClientError, SanityClient} from '@sanity/client'
import {Observable, timer, fromEvent, EMPTY, of, forkJoin} from 'rxjs'
import {
  map,
  startWith,
  distinctUntilChanged,
  switchMap,
  shareReplay,
  catchError,
} from 'rxjs/operators'
import {
  CrossProjectTokenStore,
  DocumentStore,
  useDocumentStore,
  useCrossProjectTokenStore,
} from '../../../datastores'
import {useClient} from '../../../hooks'
import {createHookFromObservableFactory, getPublishedId, getDraftId} from '../../../util'
import type {AvailabilityResponse} from '../../../preview'

// this is used in place of `instanceof` so the matching can be more robust and
// won't have any issues with dual packages etc
// https://nodejs.org/api/packages.html#dual-package-hazard
function isClientError(e: unknown): e is ClientError {
  if (typeof e !== 'object') return false
  if (!e) return false
  return 'statusCode' in e && 'response' in e
}

const POLL_INTERVAL = 5000

// only fetches when the document is visible
let visiblePoll$: Observable<number>
const getVisiblePoll$ = () => {
  if (!visiblePoll$) {
    visiblePoll$ = fromEvent(document, 'visibilitychange').pipe(
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
  }
  return visiblePoll$
}

export type ReferringDocuments = {
  isLoading: boolean
  totalCount: number
  projectIds: string[]
  internalReferences?: {
    totalCount: number
    references: Array<{_id: string; _type: string}>
  }
  crossDatasetReferences?: {
    totalCount: number
    references: Array<{
      /**
       * The project ID of the document that is currently referencing the subject
       * document. Unlike `documentId` and `datasetName`, this should always be
       * defined.
       */
      projectId: string
      /**
       * The ID of the document that is currently referencing the subject
       * document. This will be omitted if there is no access to the current
       * project and dataset pair (e.g. if no `sanity-project-token` were
       * configured)
       */
      documentId?: string
      /**
       * The dataset name that is currently referencing the subject document.
       * This will be omitted if there is no access to the current project and
       * dataset pair (e.g. if no `sanity-project-token` were configured)
       */
      datasetName?: string
    }>
  }
}

function getDocumentExistence(
  documentId: string,
  {versionedClient}: {versionedClient: SanityClient}
): Observable<string | undefined> {
  const draftId = getDraftId(documentId)
  const publishedId = getPublishedId(documentId)
  const requestOptions = {
    uri: versionedClient.getDataUrl('doc', `${draftId},${publishedId}`),
    json: true,
    query: {excludeContent: 'true'},
    tag: 'use-referring-documents.document-existence',
  }
  return versionedClient.observable.request<AvailabilityResponse>(requestOptions).pipe(
    map(({omitted}) => {
      const nonExistant = omitted.filter((doc) => doc.reason === 'existence')
      if (nonExistant.length === 2) {
        // None of the documents exist
        return undefined
      }

      if (nonExistant.length === 0) {
        // Both exist, so use the published one
        return publishedId
      }

      // If the draft does not exist, use the published ID, and vice versa
      return nonExistant.some((doc) => doc.id === draftId) ? publishedId : draftId
    })
  )
}

/**
 * fetches the cross-dataset references using the client observable.request
 * method (for that requests can be automatically cancelled)
 */
function fetchCrossDatasetReferences(
  documentId: string,
  context: {versionedClient: SanityClient; crossProjectTokenStore: CrossProjectTokenStore}
): Observable<ReferringDocuments['crossDatasetReferences']> {
  const {crossProjectTokenStore, versionedClient} = context

  return getVisiblePoll$().pipe(
    switchMap(() =>
      forkJoin({
        checkDocumentId: getDocumentExistence(documentId, context),
        crossProjectTokens: crossProjectTokenStore.fetchAllCrossProjectTokens(),
      })
    ),
    switchMap(({checkDocumentId, crossProjectTokens}) => {
      if (!checkDocumentId) {
        return of({totalCount: 0, references: []})
      }

      const currentDataset = versionedClient.config().dataset
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
          url: `/data/references/${currentDataset}/documents/${checkDocumentId}/to?excludeInternalReferences=true&excludePaths=true`,
          headers,
          tag: 'use-referring-documents.external',
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

const useInternalReferences = createHookFromObservableFactory(
  (documentId: string, context: {documentStore: DocumentStore}) => {
    const {documentStore} = context
    const referencesClause = '*[references($documentId)][0...100]{_id,_type}'
    const totalClause = 'count(*[references($documentId)])'
    const fetchQuery = `{"references":${referencesClause},"totalCount":${totalClause}}`
    const listenQuery = '*[references($documentId)]'

    return documentStore.listenQuery(
      {fetch: fetchQuery, listen: listenQuery},
      {documentId},
      {tag: 'use-referring-documents', transitions: ['appear', 'disappear'], throttleTime: 5000}
    ) as Observable<ReferringDocuments['internalReferences']>
  }
)

const useCrossDatasetReferences = createHookFromObservableFactory(
  (
    documentId: string,
    context: {crossProjectTokenStore: CrossProjectTokenStore},
    versionedClient: SanityClient
  ) => {
    const {crossProjectTokenStore} = context

    return getVisiblePoll$().pipe(
      switchMap(() =>
        fetchCrossDatasetReferences(documentId, {
          versionedClient,
          crossProjectTokenStore,
        })
      )
    )
  }
)

export function useReferringDocuments(documentId: string): ReferringDocuments {
  const client = useClient()
  const versionedClient = useMemo(() => client.withConfig({apiVersion: '2022-03-07'}), [client])

  const documentStore = useDocumentStore()
  const crossProjectTokenStore = useCrossProjectTokenStore()
  const publishedId = getPublishedId(documentId)

  const [internalReferences, isInternalReferencesLoading] = useInternalReferences(publishedId, {
    documentStore,
  })

  const [crossDatasetReferences, isCrossDatasetReferencesLoading] = useCrossDatasetReferences(
    publishedId,
    {crossProjectTokenStore},
    versionedClient
  )

  const projectIds = useMemo(() => {
    return Array.from(
      new Set(
        crossDatasetReferences?.references
          .map((crossDatasetReference) => crossDatasetReference.projectId)
          .filter(Boolean)
      )
    ).sort()
  }, [crossDatasetReferences?.references])

  return {
    totalCount: (internalReferences?.totalCount || 0) + (crossDatasetReferences?.totalCount || 0),
    projectIds,
    internalReferences,
    crossDatasetReferences,
    isLoading: isInternalReferencesLoading || isCrossDatasetReferencesLoading,
  }
}
