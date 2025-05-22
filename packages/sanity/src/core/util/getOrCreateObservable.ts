import {type QueryParams} from '@sanity/client'
import {catchError, finalize, map, type Observable, of, shareReplay} from 'rxjs'

import {type DocumentPreviewStore} from '../preview/documentPreviewStore'
import {createSWR} from './rxSwr'

// Create a singleton cache for observables
export const observableCache = new Map<string, Observable<any>>()
const swr = createSWR<any>({maxSize: 100})

/**
 * Retrieves an observable for the specified document or creates a new one if it doesn't exist in the cache
 *
 * @param options - The options for creating or retrieving the observable.
 * options.documentPreviewStore - The store used to observe document IDs.
 * options.filter - The filter to use for observing documents.
 * options.publishedId - The ID of the published document.
 * options.projectId - The project ID.
 * options.dataset - The dataset name.
 * options.apiVersion - The API version to use.
 * options.mapValue - Function to map the observed value to the desired format.
 * @returns An observable that emits the mapped document state.
 *
 * @hidden
 * @internal
 */
export function getOrCreateObservable<T = any>(options: {
  documentPreviewStore: DocumentPreviewStore
  filter: string
  params?: QueryParams
  publishedId: string
  projectId: string
  dataset: string
  apiVersion: string
  mapValue: (value: any) => T
}): Observable<T> {
  const {
    documentPreviewStore,
    projectId,
    dataset,
    filter,
    publishedId,
    apiVersion,
    mapValue,
    params = undefined,
  } = options
  const cacheKey = `${projectId}-${dataset}-${publishedId}`

  const cachedObservable = observableCache.get(cacheKey)
  if (cachedObservable) {
    return cachedObservable
  }

  const newObservable = documentPreviewStore
    .unstable_observeDocumentIdSet(filter, params, {
      apiVersion,
    })
    .pipe(
      swr(cacheKey),
      map(({value}) => mapValue(value)),
      catchError((error) => {
        return of({error, data: null, loading: false} as T)
      }),
      finalize(() => {
        observableCache.delete(cacheKey)
      }),
      shareReplay({refCount: true, bufferSize: 1}),
    )

  observableCache.set(cacheKey, newObservable)
  return newObservable
}
