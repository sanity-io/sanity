import {useMemo} from 'react'
import {ClientError, SanityClient} from '@sanity/client'
import {Observable, timer, fromEvent, EMPTY, of} from 'rxjs'
import {
  map,
  startWith,
  distinctUntilChanged,
  switchMap,
  shareReplay,
  catchError,
} from 'rxjs/operators'
import {
  AvailabilityResponse,
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  DocumentStore,
  useDocumentStore,
  createHookFromObservableFactory,
  getDraftId,
  getPublishedId,
  useClient,
} from 'sanity'

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
  datasetNames: string[]
  hasUnknownDatasetNames: boolean
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
  context: {versionedClient: SanityClient}
): Observable<ReferringDocuments['crossDatasetReferences']> {
  const {versionedClient} = context

  return getVisiblePoll$().pipe(
    switchMap(() => getDocumentExistence(documentId, context)),
    switchMap((checkDocumentId) => {
      if (!checkDocumentId) {
        return of({totalCount: 0, references: []})
      }

      const currentDataset = versionedClient.config().dataset

      return versionedClient.observable
        .request({
          url: `/data/references/${currentDataset}/documents/${checkDocumentId}/to?excludeInternalReferences=true&excludePaths=true`,
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
  ([documentId, documentStore]: [string, DocumentStore]) => {
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
  ([documentId, versionedClient]: [string, SanityClient]) => {
    // (documentId: string, versionedClient: SanityClient) => {
    return getVisiblePoll$().pipe(
      switchMap(() =>
        fetchCrossDatasetReferences(documentId, {
          versionedClient,
        })
      )
    )
  }
)

export function useReferringDocuments(documentId: string): ReferringDocuments {
  const versionedClient = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  const documentStore = useDocumentStore()
  const publishedId = getPublishedId(documentId)

  const [internalReferences, isInternalReferencesLoading] = useInternalReferences(
    useMemo(() => [publishedId, documentStore], [documentStore, publishedId])
  )

  const [crossDatasetReferences, isCrossDatasetReferencesLoading] = useCrossDatasetReferences(
    useMemo(() => [publishedId, versionedClient], [publishedId, versionedClient])
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

  const datasetNames = useMemo(() => {
    return Array.from(
      new Set<string>(
        crossDatasetReferences?.references
          // .filter((name) => typeof name === 'string')
          .map((crossDatasetReference) => crossDatasetReference?.datasetName || '')
          .filter((datasetName) => Boolean(datasetName) && datasetName !== '')
      )
    ).sort()
  }, [crossDatasetReferences?.references])

  const hasUnknownDatasetNames = useMemo(() => {
    return Boolean(
      crossDatasetReferences?.references.some(
        (crossDatasetReference) => typeof crossDatasetReference.datasetName !== 'string'
      )
    )
  }, [crossDatasetReferences?.references])

  return {
    totalCount: (internalReferences?.totalCount || 0) + (crossDatasetReferences?.totalCount || 0),
    projectIds,
    datasetNames,
    hasUnknownDatasetNames,
    internalReferences,
    crossDatasetReferences,
    isLoading: isInternalReferencesLoading || isCrossDatasetReferencesLoading,
  }
}
