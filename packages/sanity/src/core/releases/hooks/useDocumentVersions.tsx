import {type QueryParams} from '@sanity/client'
import {getVersionFromId, isPublishedId} from '@sanity/client/csm'
import {type DocumentSystem} from '@sanity/types'
import {useEffect, useMemo, useState} from 'react'
import {
  catchError,
  combineLatest,
  finalize,
  map,
  type Observable,
  of,
  shareReplay,
  switchMap,
} from 'rxjs'

import {useDataset} from '../../hooks/useDataset'
import {useProjectId} from '../../hooks/useProjectId'
import {DOCUMENT_SYSTEM_FIELD} from '../../preview/constants'
import {type DocumentPreviewStore} from '../../preview/documentPreviewStore'
import {useDocumentPreviewStore} from '../../store'
import {getPublishedId} from '../../util/draftUtils'
import {createSWR} from '../../util/rxSwr'
import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../util/releasesClient'

export interface DocumentPerspectiveProps {
  documentId: string
}

export interface DocumentVersion {
  _id: string
  // TODO: Update to `_system` when the API action ships.
  [DOCUMENT_SYSTEM_FIELD]: DocumentSystem
}

export interface DocumentPerspectiveState {
  data: string[]
  versions: DocumentVersion[]
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
 * @param props - document Id of the document (might include release id)
 * @returns - data: document versions, loading, errors
 * @hidden
 * @beta
 */
export function useDocumentVersions(props: DocumentPerspectiveProps): DocumentPerspectiveState {
  const {documentId} = props
  const publishedId = getPublishedId(documentId)

  const dataset = useDataset()
  const projectId = useProjectId()
  const documentPreviewStore = useDocumentPreviewStore()
  const [results, setResults] = useState<DocumentPerspectiveState>(INITIAL_VALUE)

  const observable: Observable<DocumentPerspectiveState> = useMemo(() => {
    return getOrCreateDocumentVersionsObservable({
      documentPreviewStore,
      publishedId,
      projectId,
      dataset,
    })
  }, [dataset, documentPreviewStore, projectId, publishedId])

  useEffect(() => {
    const subscription = observable.subscribe((result) => {
      setResults(result)
    })
    return () => subscription.unsubscribe()
  }, [observable])

  return results
}

/**
 * Temporally builds the document system for a given document id.
 * This is used until the documents are migrated to the new system.
 * And only if the documents are not variant documents.
 *
 * Variants will include the system field.
 */
const temporallyBuildDocumentSystem = (id: string): DocumentSystem => {
  const versionId = getVersionFromId(id)
  if (versionId) {
    return {
      bundleId: versionId,
      // TODO: Only attach the release if a release actually exists, e.g. agent documents don't have a release.
      release: {_type: 'reference', _ref: versionId, _weak: true},
      variant: null,
      group: {
        _type: 'reference',
        _ref: getPublishedId(id),
        _weak: true,
      },
      scopeId: versionId,
    }
  }

  return {
    bundleId: isPublishedId(id) ? '$published' : 'drafts',
    release: null,
    variant: null,
    group: {_type: 'reference', _ref: getPublishedId(id), _weak: true},
    scopeId: versionId || null,
  }
}

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

        return combineLatest(
          documentIds.map((id) =>
            documentPreviewStore.observeDocumentSystemFromId(id, {projectId, dataset}).pipe(
              map((system) => ({
                _id: id,
                [DOCUMENT_SYSTEM_FIELD]: system ?? temporallyBuildDocumentSystem(id),
              })),
            ),
          ),
        ).pipe(
          map((versions) => ({
            data: documentIds,
            versions,
            error: null,
            loading: false,
          })),
        )
      }),
      catchError((error) => {
        return of({error, data: [] as string[], versions: [] as DocumentVersion[], loading: false})
      }),
      finalize(() => {
        observableCache.delete(cacheKey)
      }),
      shareReplay({refCount: true, bufferSize: 1}),
    )

  observableCache.set(cacheKey, newObservable)
  return newObservable
}
