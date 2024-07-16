import {type MutationEvent, type SanityClient, type WelcomeEvent} from '@sanity/client'
import {difference, flatten, memoize} from 'lodash'
import {
  combineLatest,
  concat,
  defer,
  EMPTY,
  fromEvent,
  merge,
  type Observable,
  of as observableOf,
  timer,
} from 'rxjs'
import {
  distinctUntilChanged,
  filter,
  map,
  mergeMap,
  share,
  shareReplay,
  startWith,
  switchMap,
  tap,
} from 'rxjs/operators'

import {INCLUDE_FIELDS} from './constants'
import {type ApiConfig, type FieldName, type Id, type PreviewPath, type Selection} from './types'
import {debounceCollect} from './utils/debounceCollect'
import {hasEqualFields} from './utils/hasEqualFields'
import {isUniqueBy} from './utils/isUniqueBy'
import {combineSelections, reassemble, toQuery} from './utils/optimizeQuery'

type CachedFieldObserver = {
  id: Id
  fields: FieldName[]
  changes$: Observable<any>
}

type Cache = {
  [id: string]: CachedFieldObserver[]
}

export function createObserveFields(context: {
  versionedClient: SanityClient
  globalListener: Observable<WelcomeEvent | MutationEvent>
}) {
  const {versionedClient, globalListener} = context
  function listen(id: Id) {
    return globalListener.pipe(
      filter((event) => event.type === 'welcome' || event.documentId === id),
    )
  }

  function fetchAllDocumentPathsWith(client: SanityClient) {
    return function fetchAllDocumentPath(selections: Selection[]) {
      const combinedSelections = combineSelections(selections)
      return client.observable
        .fetch(toQuery(combinedSelections), {}, {tag: 'preview.document-paths'} as any)
        .pipe(map((result: any) => reassemble(result, combinedSelections)))
    }
  }

  const fetchDocumentPathsFast = debounceCollect(fetchAllDocumentPathsWith(versionedClient), 100)
  const fetchDocumentPathsSlow = debounceCollect(fetchAllDocumentPathsWith(versionedClient), 1000)

  function currentDatasetListenFields(id: Id, fields: PreviewPath[]) {
    return listen(id).pipe(
      switchMap((event) => {
        if (event.type === 'welcome' || event.visibility === 'query') {
          return fetchDocumentPathsFast(id, fields as any).pipe(
            mergeMap((result) => {
              return concat(
                observableOf(result),
                result === undefined // hack: if we get undefined as result here it can be because the document has
                  ? // just been created and is not yet indexed. We therefore need to wait a bit
                    // and then re-fetch.
                    fetchDocumentPathsSlow(id, fields as any)
                  : [],
              )
            }),
          )
        }
        return fetchDocumentPathsSlow(id, fields as any)
      }),
    )
  }

  // keep for debugging purposes for now
  // function fetchDocumentPaths(id, selection) {
  //   return client.observable.fetch(`*[_id==$id]{_id,_type,${selection.join(',')}}`, {id})
  //     .map(result => result[0])
  // }

  const CACHE: Cache = {} // todo: use a LRU cache instead (e.g. hashlru or quick-lru)

  const getBatchFetcherForDataset = memoize(
    function getBatchFetcherForDataset(apiConfig: ApiConfig) {
      const client = versionedClient.withConfig(apiConfig)
      const fetchAll = fetchAllDocumentPathsWith(client)
      return debounceCollect(fetchAll, 10)
    },
    (apiConfig) => apiConfig.dataset + apiConfig.projectId,
  )

  const CROSS_DATASET_PREVIEW_POLL_INTERVAL = 10000
  // We want to poll for changes in the other dataset, but only when window/tab is visible
  // This sets up a shared stream that emits an event every `POLL_INTERVAL` milliseconds as long as the
  // document is visible. It starts emitting immediately (if the page is visible)
  const visiblePoll$ = fromEvent(document, 'visibilitychange').pipe(
    startWith(0),
    map(() => document.visibilityState === 'visible'),
    switchMap((visible) => (visible ? timer(0, CROSS_DATASET_PREVIEW_POLL_INTERVAL) : EMPTY)),
    share(),
  )

  function crossDatasetListenFields(id: Id, fields: PreviewPath[], apiConfig: ApiConfig) {
    return visiblePoll$.pipe(startWith(0)).pipe(
      switchMap(() => {
        const batchFetcher = getBatchFetcherForDataset(apiConfig)
        return batchFetcher(id, fields as any)
      }),
    )
  }

  function createCachedFieldObserver<T>(
    id: any,
    fields: any,
    apiConfig: ApiConfig,
  ): CachedFieldObserver {
    let latest: T | null = null
    const changes$ = merge(
      defer(() => (latest === null ? EMPTY : observableOf(latest))),
      (apiConfig
        ? (crossDatasetListenFields(id, fields, apiConfig) as any)
        : currentDatasetListenFields(id, fields)) as Observable<T>,
    ).pipe(
      tap((v: T | null) => (latest = v)),
      shareReplay({refCount: true, bufferSize: 1}),
    )

    return {id, fields, changes$}
  }

  function cachedObserveFields(id: Id, fields: FieldName[], apiConfig?: ApiConfig) {
    const cacheKey = apiConfig
      ? `${apiConfig.projectId}:${apiConfig.dataset}:${id}`
      : `$current$-${id}`

    if (!(cacheKey in CACHE)) {
      CACHE[cacheKey] = []
    }

    const existingObservers = CACHE[cacheKey]
    const missingFields = difference(
      fields,
      flatten(existingObservers.map((cachedFieldObserver) => cachedFieldObserver.fields)),
    )

    if (missingFields.length > 0) {
      existingObservers.push(createCachedFieldObserver(id, fields, apiConfig as any))
    }

    const cachedFieldObservers = existingObservers
      .filter((observer) => observer.fields.some((fieldName) => fields.includes(fieldName)))
      .map((cached) => cached.changes$)

    return combineLatest(cachedFieldObservers).pipe(
      // in the event that a document gets deleted, the cached values will be updated to store `undefined`
      // if this happens, we should not pick any fields from it, but rather just return null
      map((snapshots) => snapshots.filter(Boolean)), // make sure all snapshots agree on same revision
      filter((snapshots) => isUniqueBy(snapshots, (snapshot) => snapshot._rev)), // pass on value with the requested fields (or null if value is deleted)
      map((snapshots) => (snapshots.length === 0 ? null : pickFrom(snapshots, fields))), // emit values only if changed
      distinctUntilChanged(hasEqualFields(fields)),
    )
  }

  // API
  return {observeFields: cachedObserveFields}

  function pickFrom(objects: Record<string, any>[], fields: string[]) {
    return [...INCLUDE_FIELDS, ...fields].reduce((result, fieldName) => {
      const value = getFirstFieldValue(objects, fieldName)
      if (value !== undefined) {
        ;(result as any)[fieldName] = value
      }
      return result
    }, {})
  }

  function getFirstFieldValue(objects: Record<string, any>[], fieldName: string) {
    let value
    objects.some((object) => {
      if (fieldName in object) {
        value = object[fieldName]
        return true
      }
      return false
    })
    return value
  }
}
