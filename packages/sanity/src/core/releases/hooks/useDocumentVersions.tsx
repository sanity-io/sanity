import {type ReleaseDocument} from '@sanity/client'
import {getVersionFromId} from '@sanity/client/csm'
import {type DocumentSystem} from '@sanity/types'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {
  catchError,
  combineLatest,
  finalize,
  map,
  type Observable,
  of,
  ReplaySubject,
  share,
  startWith,
  switchMap,
  timer,
} from 'rxjs'

import {useDataset} from '../../hooks/useDataset'
import {useProjectId} from '../../hooks/useProjectId'
import {DOCUMENT_SYSTEM_FIELD} from '../../preview/constants'
import {type DocumentPreviewStore} from '../../preview/documentPreviewStore'
import {useDocumentPreviewStore} from '../../store'
import {isDraftId} from '../../util'
import {getPublishedId} from '../../util/draftUtils'
import {isRecord} from '../../util/isRecord'
import {createSWR} from '../../util/rxSwr'
import {type VersionInfoDocumentStub} from '../store/types'
import {useReleasesStore} from '../store/useReleasesStore'
import {ARCHIVED_RELEASE_STATES} from '../util/const'
import {getReleaseIdFromReleaseDocumentId} from '../util/getReleaseIdFromReleaseDocumentId'

export interface DocumentPerspectiveProps {
  documentId: string
}

export interface DocumentPerspectiveState {
  data: string[]
  versions: VersionInfoDocumentStub[]
  error?: unknown
  loading: boolean
}

const INITIAL_VALUE: DocumentPerspectiveState = {
  data: [],
  versions: [],
  error: null,
  loading: true,
}

// Create a singleton cache for observables
export const observableCache = new Map<string, Observable<DocumentPerspectiveState>>()
// releases flow via combineLatest, never in the cache key, to avoid cache thrash on every release edit
export const withSystemCache = new Map<string, Observable<DocumentPerspectiveState>>()
const swr = createSWR<string[]>({maxSize: 100})

// How long to keep the pipeline alive after the last subscriber unsubscribes.
// Subscriber churn (components re-rendering/remounting around commits) can
// momentarily drop the refcount to zero. A bare teardown deletes the cache
// entry, and the re-created pipeline synchronously re-enters the
// `startWith(loadingState)` path (the version id set is non-empty for any
// document with a draft or published variant), so `loading: true` reaches
// `useDocumentForm`'s `ready` gate and flips the form read-only until the
// `observePaths` round trip settles — silently swallowing keystrokes typed in
// that window.
const TEARDOWN_GRACE_PERIOD = 1_000

/**
 * Fetches the document versions for a given document
 *
 * @param props - document Id of the document (might include release id)
 * @returns - data: document versions, loading, errors
 * @hidden
 * @beta
 */
export function useDocumentVersions(props: DocumentPerspectiveProps): DocumentPerspectiveState {
  const observable = useDocumentVersionsObservable(props)
  return useObservable(observable, INITIAL_VALUE)
}

/**
 * Creates an observable that emits the document versions for a given document.
 *
 * @hidden
 * @beta
 */
export function useDocumentVersionsObservable(
  props: DocumentPerspectiveProps,
): Observable<DocumentPerspectiveState> {
  const {documentId} = props
  const publishedId = getPublishedId(documentId)

  const dataset = useDataset()
  const projectId = useProjectId()
  const documentPreviewStore = useDocumentPreviewStore()
  const {state$: releasesState$} = useReleasesStore()

  const releases$ = useMemo(
    () =>
      releasesState$.pipe(
        map((state) =>
          Array.from(state.releases.values()).filter(
            (release) => !ARCHIVED_RELEASE_STATES.includes(release.state),
          ),
        ),
      ),
    [releasesState$],
  )

  const observable: Observable<DocumentPerspectiveState> = useMemo(
    () =>
      getOrCreateDocumentVersionsWithSystemObservable({
        documentPreviewStore,
        publishedId,
        projectId,
        dataset,
        releases$,
      }),
    [dataset, documentPreviewStore, projectId, publishedId, releases$],
  )

  return observable
}

/**
 * Temporarily builds the document _system for a given document id.
 * This is used until the documents are migrated to the new _system.
 * And only if the documents are not variant documents.
 *
 * Variants will include the _system field.
 */
const buildDocumentSystem = (id: string, releases: ReleaseDocument[]): DocumentSystem => {
  const versionId = getVersionFromId(id)
  if (versionId) {
    const releaseDocument = releases.find(
      (release) => getReleaseIdFromReleaseDocumentId(release._id) === versionId,
    )
    return {
      bundleId: versionId,
      release: releaseDocument ? {_ref: releaseDocument._id, _weak: true} : undefined,
      group: {
        _ref: getPublishedId(id),
        _weak: true,
      },
      scopeId: versionId,
    }
  }

  return {
    bundleId: isDraftId(id) ? 'drafts' : undefined,
    group: {_ref: getPublishedId(id), _weak: true},
  }
}

const resolveVersionSystem = (
  version: VersionInfoDocumentStub,
  releases: ReleaseDocument[],
): DocumentSystem => {
  if (version._system?.group) return version._system

  return {
    ...version._system,
    ...buildDocumentSystem(version._id, releases),
  }
}

const DOCUMENT_STUB_PATHS = ['_id', '_type', '_rev', '_createdAt', '_updatedAt', '_system']

function getOrCreateCachedObservable<T>(
  cache: Map<string, Observable<T>>,
  cacheKey: string,
  createObservable: () => Observable<T>,
): Observable<T> {
  const cached = cache.get(cacheKey)
  if (cached) return cached

  const observable = createObservable().pipe(
    finalize(() => cache.delete(cacheKey)),
    share({
      connector: () => new ReplaySubject(1),
      resetOnRefCountZero: () => timer(TEARDOWN_GRACE_PERIOD),
    }),
  )

  cache.set(cacheKey, observable)
  return observable
}

export function getOrCreateDocumentVersionsWithSystemObservable(options: {
  documentPreviewStore: DocumentPreviewStore
  publishedId: string
  projectId: string
  dataset: string
  releases$: Observable<ReleaseDocument[]>
}): Observable<DocumentPerspectiveState> {
  const {documentPreviewStore, projectId, dataset, publishedId, releases$} = options
  const cacheKey = `${projectId}-${dataset}-${publishedId}`

  return getOrCreateCachedObservable(withSystemCache, cacheKey, () =>
    combineLatest([
      getOrCreateDocumentVersionsObservable({
        documentPreviewStore,
        publishedId,
        projectId,
        dataset,
      }),
      releases$,
    ]).pipe(
      map(([result, releases]) => ({
        ...result,
        versions: result.versions.map((version) => ({
          ...version,
          [DOCUMENT_SYSTEM_FIELD]: resolveVersionSystem(version, releases),
        })),
      })),
    ),
  )
}

/**
 * Retrieves an observable that emits document IDs matching the document versions that exist for a specific id
 *
 * @param options - The options for creating or retrieving the observable.
 * options.documentPreviewStore - The store used to observe document IDs.
 * options.publishedId - The ID of the published document.
 * options.projectId - The project ID.
 * options.dataset - The dataset name.
 * @returns An observable that emits the document versions.
 *
 * @hidden
 * @internal
 */
export function getOrCreateDocumentVersionsObservable(options: {
  documentPreviewStore: DocumentPreviewStore
  publishedId: string
  projectId: string
  dataset: string
}): Observable<DocumentPerspectiveState> {
  const {documentPreviewStore, projectId, dataset, publishedId} = options
  const cacheKey = `${projectId}-${dataset}-${publishedId}`

  return getOrCreateCachedObservable(observableCache, cacheKey, () =>
    documentPreviewStore.unstable_observeVersionDocumentIds(publishedId).pipe(
      swr(cacheKey),
      map(({value}) => value),
      switchMap((documentIds): Observable<DocumentPerspectiveState> => {
        if (documentIds.length === 0) {
          return of({data: [], versions: [], error: null, loading: false})
        }

        const loadingState: DocumentPerspectiveState = {
          data: documentIds,
          versions: [],
          error: null,
          loading: true,
        }

        return combineLatest(
          documentIds.map((id) =>
            documentPreviewStore.observePaths({_id: id}, DOCUMENT_STUB_PATHS).pipe(
              map((versionInfo) => (isRecord(versionInfo) ? versionInfo : undefined)),
              map(
                (versionInfo) =>
                  ({
                    _id: id,
                    _rev: versionInfo?._rev ?? '',
                    _createdAt: versionInfo?._createdAt ?? '',
                    _updatedAt: versionInfo?._updatedAt ?? '',
                    [DOCUMENT_SYSTEM_FIELD]: versionInfo?.[DOCUMENT_SYSTEM_FIELD] as DocumentSystem,
                  }) satisfies VersionInfoDocumentStub,
              ),
            ),
          ),
        ).pipe(
          map((versions) => ({
            data: documentIds,
            versions,
            error: null,
            loading: false,
          })),
          startWith(loadingState),
        )
      }),
      catchError((error) => {
        return of({
          error,
          data: [] as string[],
          versions: [] as VersionInfoDocumentStub[],
          loading: false,
        })
      }),
    ),
  )
}
