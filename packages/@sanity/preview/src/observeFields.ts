import client from 'part:@sanity/base/client'
import {
  combineLatest,
  concat,
  defer,
  EMPTY,
  from as observableFrom,
  merge,
  Observable,
  of as observableOf,
} from 'rxjs'
import {
  distinctUntilChanged,
  filter,
  map,
  mergeMap,
  publishReplay,
  refCount,
  share,
  switchMap,
  tap,
} from 'rxjs/operators'
import {difference, flatten} from 'lodash'
import debounceCollect from './utils/debounceCollect'
import {combineSelections, reassemble, toGradientQuery} from './utils/optimizeQuery'
import {FieldName, Id, Selection} from './types'
import {INCLUDE_FIELDS} from './constants'
import hasEqualFields from './utils/hasEqualFields'
import isUniqueBy from './utils/isUniqueBy'

let _globalListener
const getGlobalEvents = () => {
  if (!_globalListener) {
    const allEvents$ = observableFrom(
      client.listen(
        '*[!(_id in path("_.**"))]',
        {},
        {events: ['welcome', 'mutation'], includeResult: false, visibility: 'query'}
      )
    ).pipe(share())

    // This is a stream of welcome events from the server, each telling us that we have established listener connection
    // We map these to snapshot fetch/sync. It is good to wait for the first welcome event before fetching any snapshots as, we may miss
    // events that happens in the time period after initial fetch and before the listener is established.
    const welcome$ = allEvents$.pipe(
      filter((event: any) => event.type === 'welcome'),
      publishReplay(1),
      refCount()
    )

    // This will keep the listener active forever and in turn reduce the number of initial fetches
    // as less 'welcome' events will be emitted.
    // @todo: see if we can delay unsubscribing or connect with some globally defined shared listener
    welcome$.subscribe()

    const mutations$ = allEvents$.pipe(filter((event: any) => event.type === 'mutation'))
    _globalListener = {
      welcome$,
      mutations$,
    }
  }
  return _globalListener
}

function listen(id: Id) {
  const globalEvents = getGlobalEvents()
  return merge(
    globalEvents.welcome$,
    globalEvents.mutations$.pipe(filter((event: any) => event.documentId === id))
  )
}

function fetchAllDocumentPaths(selections: Selection[]) {
  const combinedSelections = combineSelections(selections)
  return client.observable
    .fetch(toGradientQuery(combinedSelections))
    .pipe(map((result: any) => reassemble(result, combinedSelections)))
}

const fetchDocumentPathsFast = debounceCollect(fetchAllDocumentPaths, 100)
const fetchDocumentPathsSlow = debounceCollect(fetchAllDocumentPaths, 1000)

function listenFields(id: Id, fields: FieldName[]) {
  return listen(id).pipe(
    switchMap((event: any) => {
      if (event.type === 'welcome' || event.visibility === 'query') {
        return fetchDocumentPathsFast(id, fields).pipe(
          mergeMap((result) => {
            return concat(
              observableOf(result),
              result === undefined // hack: if we get undefined as result here it can be because the document has
                ? // just been created and is not yet indexed. We therefore need to wait a bit
                  // and then re-fetch.
                  fetchDocumentPathsSlow(id, fields)
                : []
            )
          })
        )
      }
      return fetchDocumentPathsSlow(id, fields)
    })
  )
}

// keep for debugging purposes for now
// function fetchDocumentPaths(id, selection) {
//   return client.observable.fetch(`*[_id==$id]{_id,_type,${selection.join(',')}}`, {id})
//     .map(result => result[0])
// }

type CachedFieldObserver = {
  id: Id
  fields: FieldName[]
  changes$: Observable<any>
}

type Cache = {
  [id: string]: CachedFieldObserver[]
}
const CACHE: Cache = {} // todo: use a LRU cache instead (e.g. hashlru or quick-lru)

function createCachedFieldObserver<T>(id, fields): CachedFieldObserver {
  let latest: T | null = null
  const changes$ = merge<T | null>(
    defer(() => (latest === null ? EMPTY : observableOf(latest))),
    listenFields(id, fields) as Observable<T>
  ).pipe(
    tap((v: T | null) => (latest = v)),
    publishReplay(1),
    refCount()
  )

  return {id, fields, changes$}
}

export default function cachedObserveFields(id: Id, fields: FieldName[]) {
  if (!(id in CACHE)) {
    CACHE[id] = []
  }

  const existingObservers = CACHE[id]
  const missingFields = difference(
    fields,
    flatten(existingObservers.map((cachedFieldObserver) => cachedFieldObserver.fields))
  )

  if (missingFields.length > 0) {
    existingObservers.push(createCachedFieldObserver(id, fields))
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
    distinctUntilChanged(hasEqualFields(fields))
  )
}

function pickFrom(objects: Record<string, any>[], fields: string[]) {
  return [...INCLUDE_FIELDS, ...fields].reduce((result, fieldName) => {
    const value = getFirstFieldValue(objects, fieldName)
    if (value !== undefined) {
      result[fieldName] = value
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
