import {catchError, finalize, map, type Observable, of, shareReplay} from 'rxjs'

import {type DocumentPreviewStore} from '../preview/documentPreviewStore'
import {type DocumentPerspectiveState} from '../releases/hooks/useDocumentVersions'
import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../releases/util/releasesClient'
import {createSWR} from './rxSwr'

// Create a singleton cache for observables
export const observableCache = new Map<string, Observable<DocumentPerspectiveState>>()
const swr = createSWR<{documentIds: string[]}>({maxSize: 100})

export function getOrCreateObservable(options: {
  documentPreviewStore: DocumentPreviewStore
  publishedId: string
  projectId: string
  dataset: string
}): Observable<DocumentPerspectiveState> {
  const {documentPreviewStore, projectId, dataset, publishedId} = options
  const cacheKey = `${projectId}-${dataset}-${publishedId}`

  const cachedObservable = observableCache.get(cacheKey)
  if (cachedObservable) {
    return cachedObservable
  }

  const newObservable = documentPreviewStore
    .unstable_observeDocumentIdSet(`sanity::versionOf("${publishedId}")`, undefined, {
      apiVersion: RELEASES_STUDIO_CLIENT_OPTIONS.apiVersion,
    })
    .pipe(
      swr(cacheKey),
      map(({value}) => ({
        data: value.documentIds,
        loading: false,
        error: null,
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
