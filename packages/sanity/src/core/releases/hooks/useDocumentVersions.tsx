import {type QueryParams, type ReleaseDocument} from '@sanity/client'
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
  shareReplay,
  startWith,
  switchMap,
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
import {useActiveReleases} from '../store/useActiveReleases'
import {getReleaseIdFromReleaseDocumentId} from '../util/getReleaseIdFromReleaseDocumentId'
import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../util/releasesClient'

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
const swr = createSWR<{documentIds: string[]}>({maxSize: 100})

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
  const {data: releases} = useActiveReleases()

  const observable: Observable<DocumentPerspectiveState> = useMemo(() => {
    return getOrCreateDocumentVersionsObservable({
      documentPreviewStore,
      publishedId,
      projectId,
      dataset,
    }).pipe(
      map((result) => {
        return {
          ...result,
          versions: result.versions.map((version) => {
            return {
              ...version,
              [DOCUMENT_SYSTEM_FIELD]: version._system?.group
                ? version._system
                : {
                    ...version._system,
                    ...temporarilyBuildDocumentSystem(version._id, releases),
                  },
            }
          }),
        }
      }),
    )
  }, [dataset, documentPreviewStore, projectId, publishedId, releases])

  return observable
}

/**
 * Temporarily builds the document _system for a given document id.
 * This is used until the documents are migrated to the new _system.
 * And only if the documents are not variant documents.
 *
 * Variants will include the _system field.
 */
const temporarilyBuildDocumentSystem = (
  id: string,
  releases: ReleaseDocument[],
): DocumentSystem => {
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

const DOCUMENT_STUB_PATHS = ['_id', '_type', '_rev', '_createdAt', '_updatedAt', '_system']

/**
 * Retrieves an observable that emits document IDs matching the document versions that exist for a specific id
 *
 * @param options - The options for creating or retrieving the observable.
 * options.documentPreviewStore - The store used to observe document IDs.
 * options.params - The query params to use for the observable.
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
  params?: QueryParams
  publishedId: string
  projectId: string
  dataset: string
}): Observable<DocumentPerspectiveState> {
  const {documentPreviewStore, projectId, dataset, publishedId, params = undefined} = options
  const cacheKey = `${projectId}-${dataset}-${publishedId}`

  const cachedObservable = observableCache.get(cacheKey)
  if (cachedObservable) {
    return cachedObservable
  }

  const newObservable = documentPreviewStore
    .unstable_observeDocumentIdSet(`sanity::versionOf("${publishedId}")`, params, {
      apiVersion: RELEASES_STUDIO_CLIENT_OPTIONS.apiVersion,
    })
    .pipe(
      swr(cacheKey),
      map(({value}) => value.documentIds),
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
      finalize(() => {
        observableCache.delete(cacheKey)
      }),
      shareReplay({refCount: true, bufferSize: 1}),
    )

  observableCache.set(cacheKey, newObservable)
  return newObservable
}
