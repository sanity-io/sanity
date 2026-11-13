import {type ClientError, type SanityClient} from '@sanity/client'
import {dequal} from 'dequal/lite'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {combineLatest, concat, EMPTY, fromEvent, type Observable, of, timer} from 'rxjs'
import {
  catchError,
  distinctUntilChanged,
  map,
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
  isVersionId,
  useClient,
  useDocumentStore,
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
    references: Array<{
      _id: string
      _type: string
      /**
       * Whether this document holds a strong (required) reference to the subject document.
       * Content Lake refuses to delete a document while strong references point at it; weak
       * references are left pointing at nothing. `undefined` while unknown.
       *
       * A strong reference stored only in a release copy is not `required`: the Content Lake
       * allows the delete, and the release fails later, when it is published. Such a reference is
       * marked `failsLater` instead.
       */
      required?: boolean
      /**
       * Whether this referring document is a release copy that holds a strong reference to the
       * subject document. It does not block the delete, but the release fails when it is published.
       * `undefined` while unknown.
       */
      failsLater?: boolean
    }>
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
    url: versionedClient.getDataUrl('doc', `${draftId},${publishedId}`),
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
export function fetchCrossDatasetReferences(
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
    distinctUntilChanged(dequal),
  )
}

/**
 * @internal
 */
export interface ReferringDocumentsOptions {
  documentId: string
  versionedClient: SanityClient
  documentStore: DocumentStore
}

/**
 * Returns an observable describing the documents that refer to the given
 * document, both within the same dataset (internal references) and across
 * datasets (cross-dataset references). The observable keeps emitting as the
 * underlying queries poll/listen for changes.
 *
 * @internal
 */
export function referringDocuments({
  documentId,
  versionedClient,
  documentStore,
}: ReferringDocumentsOptions): Observable<ReferringDocuments> {
  const publishedId = getPublishedId(documentId)

  const internalReferences$ = withLoadingState(
    withReferenceStrength(
      fetchInternalReferences(publishedId, documentStore),
      publishedId,
      versionedClient,
    ),
  )

  const crossDatasetReferences$ = withLoadingState(
    getVisiblePoll$().pipe(
      switchMap(() => fetchCrossDatasetReferences(publishedId, {versionedClient})),
    ),
  )

  return combineLatest([internalReferences$, crossDatasetReferences$]).pipe(
    map(
      ([
        [internalReferences, isInternalReferencesLoading],
        [crossDatasetReferences, isCrossDatasetReferencesLoading],
      ]): ReferringDocuments => {
        const projectIds = Array.from(
          new Set(
            crossDatasetReferences?.references
              .map((crossDatasetReference) => crossDatasetReference.projectId)
              .filter(Boolean),
          ),
        ).sort()

        const datasetNames = Array.from(
          new Set<string>(
            crossDatasetReferences?.references
              .map((crossDatasetReference) => crossDatasetReference?.datasetName || '')
              .filter((datasetName) => Boolean(datasetName) && datasetName !== ''),
          ),
        ).sort()

        const hasUnknownDatasetNames = Boolean(
          crossDatasetReferences?.references.some(
            (crossDatasetReference) => typeof crossDatasetReference.datasetName !== 'string',
          ),
        )

        return {
          totalCount:
            (internalReferences?.totalCount || 0) + (crossDatasetReferences?.totalCount || 0),
          projectIds,
          datasetNames,
          hasUnknownDatasetNames,
          internalReferences,
          crossDatasetReferences,
          isLoading: isInternalReferencesLoading || isCrossDatasetReferencesLoading,
        }
      },
    ),
  )
}

const INITIAL_STATE: ReferringDocuments = {
  isLoading: true,
  totalCount: 0,
  projectIds: [],
  datasetNames: [],
  hasUnknownDatasetNames: false,
  internalReferences: undefined,
  crossDatasetReferences: undefined,
}

const EMPTY_READY_STATE: ReferringDocuments = {
  isLoading: false,
  totalCount: 0,
  projectIds: [],
  datasetNames: [],
  hasUnknownDatasetNames: false,
  internalReferences: {totalCount: 0, references: []},
  crossDatasetReferences: {totalCount: 0, references: []},
}

/**
 * @internal
 */
export interface UseReferringDocumentsOptions {
  /**
   * When `false`, skips fetching incoming references and returns an empty ready
   * state
   */
  enabled?: boolean
}

export function useReferringDocuments(
  documentId: string,
  options?: UseReferringDocumentsOptions,
): ReferringDocuments {
  const enabled = options?.enabled ?? true
  const versionedClient = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const documentStore = useDocumentStore()

  const referringDocuments$ = useMemo(() => {
    if (!enabled) {
      return of(EMPTY_READY_STATE)
    }
    return referringDocuments({documentId, versionedClient, documentStore})
  }, [documentId, documentStore, enabled, versionedClient])

  return useObservable(referringDocuments$, enabled ? INITIAL_STATE : EMPTY_READY_STATE)
}

/**
 * Fetches the documents within the same dataset that reference the subject
 * document using the document store's `listenQuery`
 */
function fetchInternalReferences(
  documentId: string,
  documentStore: DocumentStore,
): Observable<ReferringDocuments['internalReferences']> {
  // Documents now self reference themselves, within the _system.group field. We need to exclude them from the references query.
  const referencesQuery = `*[references($documentId) && _system.group._ref != $documentId]`
  const referencesClause = `${referencesQuery}[0...100]{_id,_type}`
  const totalClause = `count(${referencesQuery})`
  const fetchQuery = `{"references":${referencesClause},"totalCount":${totalClause}}`
  const listenQuery = referencesQuery

  return documentStore.listenQuery(
    {fetch: fetchQuery, listen: listenQuery},
    {documentId},
    {tag: 'use-referring-documents', transitions: ['appear', 'disappear'], throttleTime: 5000},
  ) as Observable<ReferringDocuments['internalReferences']>
}

function withLoadingState<Type>(source: Observable<Type>): Observable<[Type | undefined, boolean]> {
  return concat(
    of<[Type | undefined, boolean]>([undefined, true]),
    source.pipe(map((value): [Type | undefined, boolean] => [value, false])),
  )
}

/**
 * Whether `value` holds a strong reference to `targetId` anywhere in its content. A reference is
 * strong unless it is marked `_weak`. The document's `_system` subtree is skipped: its identity
 * references (the group, the variant, the release) are not content and never block a delete.
 *
 * @internal
 */
export function hasStrongReferenceTo(value: unknown, targetId: string): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => hasStrongReferenceTo(item, targetId))
  }
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const record = value as Record<string, unknown>
  if (record._ref === targetId && record._weak !== true) {
    return true
  }
  return Object.entries(record).some(
    ([key, child]) => key !== '_system' && hasStrongReferenceTo(child, targetId),
  )
}

/**
 * Whether `document` is a copy that belongs to a release. `_system.release` says so on documents
 * that carry `_system`; older documents without it can only be release copies when their id is a
 * version id, since variant copies always carry `_system`.
 */
function isReleaseCopy(document: Record<string, unknown>): boolean {
  const system = document._system as {release?: {_ref?: unknown}} | null | undefined
  if (system && typeof system === 'object') {
    return Boolean(system.release?._ref)
  }
  return typeof document._id === 'string' && isVersionId(document._id)
}

/**
 * How a referring document links to `targetId`, as the Content Lake sees it when the target is
 * deleted:
 *
 * - `required`: a strong reference in a published document, a draft or a variant copy. The Lake
 *   refuses the delete.
 * - `failsLater`: a strong reference stored only in a release copy. The Lake allows the delete,
 *   and the release fails when it is published.
 * - neither: only weak references. The delete goes through and the link points at nothing.
 *
 * @internal
 */
export function classifyReferrer(
  document: Record<string, unknown>,
  targetId: string,
): {required: boolean; failsLater: boolean} {
  const strong = hasStrongReferenceTo(document, targetId)
  if (!strong) return {required: false, failsLater: false}
  return isReleaseCopy(document)
    ? {required: false, failsLater: true}
    : {required: true, failsLater: false}
}

/**
 * Marks each internal reference as `required` (strong, blocks the delete), `failsLater` (strong,
 * in a release copy) or neither, by reading the referring documents once per change of the
 * reference list. If that read fails, the references are passed on unmarked, so callers fall back
 * to treating every reference as unknown.
 */
function withReferenceStrength(
  internalReferences$: Observable<ReferringDocuments['internalReferences']>,
  publishedId: string,
  versionedClient: SanityClient,
): Observable<ReferringDocuments['internalReferences']> {
  return internalReferences$.pipe(
    switchMap((internalReferences) => {
      const ids = internalReferences?.references.map((reference) => reference._id) ?? []
      if (!internalReferences || ids.length === 0) {
        return of(internalReferences)
      }
      return versionedClient.observable
        .fetch<Array<Record<string, unknown> & {_id: string}>>(
          '*[_id in $ids]',
          {ids},
          {perspective: 'raw', tag: 'use-referring-documents.strength'},
        )
        .pipe(
          map((documents) => {
            const byId = new Map(
              documents.map((document) => [document._id, classifyReferrer(document, publishedId)]),
            )
            return {
              ...internalReferences,
              references: internalReferences.references.map((reference) => ({
                ...reference,
                required: byId.get(reference._id)?.required ?? false,
                failsLater: byId.get(reference._id)?.failsLater ?? false,
              })),
            }
          }),
          catchError(() => of(internalReferences)),
        )
    }),
  )
}
