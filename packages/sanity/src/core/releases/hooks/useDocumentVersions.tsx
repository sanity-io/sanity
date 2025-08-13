import {type QueryParams} from '@sanity/client'
import {useEffect, useMemo, useState} from 'react'
import {catchError, finalize, map, type Observable, of, shareReplay} from 'rxjs'

import {useDataset} from '../../hooks/useDataset'
import {useProjectId} from '../../hooks/useProjectId'
import {type DocumentPreviewStore} from '../../preview/documentPreviewStore'
import {useDocumentPreviewStore} from '../../store/_legacy/datastores'
import {getPublishedId} from '../../util/draftUtils'
import {createSWR} from '../../util/rxSwr'
import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../util/releasesClient'

export interface DocumentPerspectiveProps {
  documentId: string
}

export interface DocumentPerspectiveState {
  data: string[]
  error?: unknown
  loading: boolean
}

const INITIAL_VALUE = {
  data: [],
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
      map(({value}) => ({
        data: value.documentIds,
        error: null,
        loading: false,
      })),
      catchError((error) => {
        return of({error, data: [] as string[], loading: false})
      }),
      finalize(() => {
        observableCache.delete(cacheKey)
      }),
      shareReplay({refCount: true, bufferSize: 1}),
    )

  observableCache.set(cacheKey, newObservable)
  return newObservable
}
