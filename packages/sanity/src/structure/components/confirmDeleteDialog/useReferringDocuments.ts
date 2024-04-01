import {type ClientError, type SanityClient} from '@sanity/client'
import {useMemo} from 'react'
import {useMemoObservable} from 'react-rx'
import {concat, EMPTY, fromEvent, type Observable, of, timer} from 'rxjs'
import {
  catchError,
  distinctUntilChanged,
  map,
  scan,
  shareReplay,
  startWith,
  switchMap,
} from 'rxjs/operators'
import {
  type AvailabilityResponse,
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  type DocumentStore,
  getDraftId,
  getPublishedId,
  useClient,
  useDocumentStore,
  useUnique,
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
          : EMPTY,
      ),
      shareReplay({refCount: true, bufferSize: 1}),
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
  {versionedClient}: {versionedClient: SanityClient},
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
    }),
  )
}

/**
 * fetches the cross-dataset references using the client observable.request
 * method (for that requests can be automatically cancelled)
 */
function fetchCrossDatasetReferences(
  documentId: string,
  context: {versionedClient: SanityClient},
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
          }),
        )
    }),
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
      {tag: 'use-referring-documents', transitions: ['appear', 'disappear'], throttleTime: 5000},
    ) as Observable<ReferringDocuments['internalReferences']>
  },
)

const useCrossDatasetReferences = createHookFromObservableFactory(
  ([documentId, versionedClient]: [string, SanityClient]) => {
    // (documentId: string, versionedClient: SanityClient) => {
    return getVisiblePoll$().pipe(
      switchMap(() =>
        fetchCrossDatasetReferences(documentId, {
          versionedClient,
        }),
      ),
    )
  },
)

export function useReferringDocuments(documentId: string): ReferringDocuments {
  const versionedClient = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  const documentStore = useDocumentStore()
  const publishedId = getPublishedId(documentId)

  const [internalReferences, isInternalReferencesLoading] = useInternalReferences(
    useMemo(() => [publishedId, documentStore], [documentStore, publishedId]),
  )

  const [crossDatasetReferences, isCrossDatasetReferencesLoading] = useCrossDatasetReferences(
    useMemo(() => [publishedId, versionedClient], [publishedId, versionedClient]),
  )

  const projectIds = useMemo(() => {
    return Array.from(
      new Set(
        crossDatasetReferences?.references
          .map((crossDatasetReference) => crossDatasetReference.projectId)
          .filter(Boolean),
      ),
    ).sort()
  }, [crossDatasetReferences?.references])

  const datasetNames = useMemo(() => {
    return Array.from(
      new Set<string>(
        crossDatasetReferences?.references
          // .filter((name) => typeof name === 'string')
          .map((crossDatasetReference) => crossDatasetReference?.datasetName || '')
          .filter((datasetName) => Boolean(datasetName) && datasetName !== ''),
      ),
    ).sort()
  }, [crossDatasetReferences?.references])

  const hasUnknownDatasetNames = useMemo(() => {
    return Boolean(
      crossDatasetReferences?.references.some(
        (crossDatasetReference) => typeof crossDatasetReference.datasetName !== 'string',
      ),
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

/**
 * The following is an inlined copy of `createHookFromObservableFactory` from core.
 * It is unclear to me why we're seeing build issues when importing it from `sanity`,
 * but for now this is considered an acceptable workaround. Revisit when we have time.
 *
 * Note: We also have a `useReferringDocuments` in core - not sure if this is duplicated
 * for the same reason.
 */
type LoadingTuple<T> = [T, boolean]

type ReactHook<TArgs, TResult> = (args: TArgs) => TResult

function createHookFromObservableFactory<T, TArg = void>(
  observableFactory: (arg: TArg) => Observable<T>,
  initialValue: T,
): ReactHook<TArg, LoadingTuple<T>>

function createHookFromObservableFactory<T, TArg = void>(
  observableFactory: (arg: TArg) => Observable<T>,
  initialValue?: T,
): ReactHook<TArg, LoadingTuple<T | undefined>>

function createHookFromObservableFactory<T, TArg = void>(
  observableFactory: (arg: TArg) => Observable<T>,
  initialValue?: T,
): ReactHook<TArg, LoadingTuple<T | undefined>> {
  const initialLoadingTuple: LoadingTuple<T | undefined> = [initialValue, true]
  const initialResult = {type: 'tuple', tuple: initialLoadingTuple} as const

  return function useLoadableFromCreateLoadable(_arg: TArg) {
    // @todo refactor callsites to make use of useMemo so that this hook can be removed
    const memoArg = useUnique(_arg)
    const result = useMemoObservable(
      () =>
        of(memoArg).pipe(
          switchMap((arg) =>
            concat(
              of({type: 'loading'} as const),
              observableFactory(arg).pipe(map((value) => ({type: 'value', value}) as const)),
            ),
          ),
          scan(([prevValue], next): LoadingTuple<T | undefined> => {
            if (next.type === 'loading') return [prevValue, true]
            return [next.value, false]
          }, initialLoadingTuple),
          distinctUntilChanged(([prevValue, prevIsLoading], [nextValue, nextIsLoading]) => {
            if (prevValue !== nextValue) return false
            if (prevIsLoading !== nextIsLoading) return false
            return true
          }),
          map((tuple) => ({type: 'tuple', tuple}) as const),
          catchError((error) => of({type: 'error', error} as const)),
        ),
      [memoArg],
      initialResult,
    )

    if (result.type === 'error') throw result.error

    return result.tuple
  }
}
