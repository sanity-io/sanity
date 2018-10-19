// @flow
import client from 'part:@sanity/base/client'
import {
  combineLatest,
  concat,
  from as observableFrom,
  merge,
  Observable,
  of as observableOf
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
  tap
} from 'rxjs/operators'
import debounceCollect from './utils/debounceCollect'
import {combineSelections, reassemble, toGradientQuery} from './utils/optimizeQuery'
import {difference, flatten} from 'lodash'
import type {FieldName, Id} from './types'
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
        {events: ['welcome', 'mutation'], includeResult: false}
      )
    ).pipe(share())

    // This will keep the listener active forever and in turn reduce the number of initial fetches
    // as less 'welcome' events will be emitted.
    // @todo: see if we can delay unsubscribing or connect with some globally defined shared listener
    allEvents$.subscribe()

    _globalListener = {
      // This is a stream of welcome events from the server, each telling us that we have established listener connection
      // We map these to snapshot fetch/sync. It is good to wait for the first welcome event before fetching any snapshots as, we may miss
      // events that happens in the time period after initial fetch and before the listener is established.
      welcome$: allEvents$.pipe(
        filter(event => event.type === 'welcome'),
        publishReplay(1),
        refCount()
      ),
      mutations$: allEvents$.pipe(filter(event => event.type === 'mutation'))
    }
  }
  return _globalListener
}

function listen(id: Id) {
  const globalEvents = getGlobalEvents()
  return merge(
    globalEvents.welcome$,
    globalEvents.mutations$.pipe(filter(event => event.documentId === id))
  )
}

function fetchAllDocumentPaths(selections: Selection[]) {
  const combinedSelections = combineSelections(selections)
  return client.observable
    .fetch(toGradientQuery(combinedSelections))
    .pipe(map(result => reassemble(result, combinedSelections)))
}

const fetchDocumentPathsFast = debounceCollect(fetchAllDocumentPaths, 100)
const fetchDocumentPathsSlow = debounceCollect(fetchAllDocumentPaths, 1000)

function listenFields(id: Id, fields: FieldName[]) {
  return listen(id).pipe(
    switchMap(event => {
      if (event.type === 'welcome') {
        return fetchDocumentPathsFast(id, fields).pipe(
          mergeMap(result => {
            return concat(
              observableOf(result),
              result === undefined
                ? // hack: if we get undefined as result here it can be because the document has
                  // just been created and is not yet indexed. We therefore need to wait a bit
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
  id: Id,
  fields: FieldName[],
  changes$: Observable
}

type Cache = {[id: Id]: CachedFieldObserver[]}
const CACHE: Cache = {} // todo: use a LRU cache instead (e.g. hashlru or quick-lru)

function createCachedFieldObserver(id, fields): CachedFieldObserver {
  let latest = null
  const changes$ = merge(
    new Observable(observer => {
      observer.next(latest)
      observer.complete()
    }).pipe(filter(Boolean)),
    listenFields(id, fields)
  ).pipe(
    tap(v => (latest = v)),
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
    flatten(existingObservers.map(cachedFieldObserver => cachedFieldObserver.fields))
  )

  if (missingFields.length > 0) {
    existingObservers.push(createCachedFieldObserver(id, fields))
  }

  const cachedFieldObservers = existingObservers
    .filter(observer => observer.fields.some(fieldName => fields.includes(fieldName)))
    .map(cached => cached.changes$)

  return combineLatest(cachedFieldObservers).pipe(
    // in the event that a document gets deleted, the cached values will be updated to store `undefined`
    // if this happens, we should not pick any fields from it, but rather just return null
    map(snapshots => snapshots.filter(Boolean)),
    // make sure all snapshots agree on same revision
    filter(snapshots => isUniqueBy(snapshots, snapshot => snapshot._rev)),
    // pass on value with the requested fields (or null if value is deleted)
    map(snapshots => (snapshots.length === 0 ? null : pickFrom(snapshots, fields))),
    // emit values only if changed
    distinctUntilChanged(hasEqualFields(fields))
  )
}

function pickFrom(objects: Object[], fields: string[]) {
  return [...INCLUDE_FIELDS, ...fields].reduce((result, fieldName) => {
    const value = getFirstFieldValue(objects, fieldName)
    if (value !== undefined) {
      result[fieldName] = value
    }
    return result
  }, {})
}

function getFirstFieldValue(objects: Object[], fieldName: string) {
  let value
  objects.some(object => {
    if (fieldName in object) {
      value = object[fieldName]
      return true
    }
    return false
  })
  return value
}
