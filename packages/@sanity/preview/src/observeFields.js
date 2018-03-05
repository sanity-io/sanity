// @flow
import client from 'part:@sanity/base/client'
import Observable from '@sanity/observable'
import debounceCollect from './utils/debounceCollect'
import {combineSelections, reassemble, toGradientQuery} from './utils/optimizeQuery'
import {flatten, difference} from 'lodash'
import type {FieldName, Id} from './types'
import {INCLUDE_FIELDS} from './constants'

let _globalListener
const getGlobalEvents = () => {
  if (!_globalListener) {
    const allEvents$ = Observable.from(
      client.listen(
        '*[!(_id in path("_.**"))]',
        {},
        {events: ['welcome', 'mutation'], includeResult: false}
      )
    ).share()

    // This will keep the listener active forever and in turn reduce the number of initial fetches
    // as less 'welcome' events will be emitted.
    // @todo: see if we can delay unsubscribing or connect with some globally defined shared listener
    allEvents$.subscribe()

    _globalListener = {
      // This is a stream of welcome events from the server, each telling us that we have established listener connection
      // We map these to snapshot fetch/sync. It is good to wait for the first welcome event before fetching any snapshots as, we may miss
      // events that happens in the time period after initial fetch and before the listener is established.
      welcome$: allEvents$
        .filter(event => event.type === 'welcome')
        .publishReplay(1)
        .refCount(),
      mutations$: allEvents$.filter(event => event.type === 'mutation')
    }
  }
  return _globalListener
}

function listen(id: Id) {
  const globalEvents = getGlobalEvents()
  return globalEvents.welcome$.merge(
    globalEvents.mutations$.filter(event => event.documentId === id)
  )
}

function fetchAllDocumentPaths(selections: Selection[]) {
  const combinedSelections = combineSelections(selections)
  return client.observable
    .fetch(toGradientQuery(combinedSelections))
    .map(result => reassemble(result, combinedSelections))
}

const fetchDocumentPathsFast = debounceCollect(fetchAllDocumentPaths, 100)
const fetchDocumentPathsSlow = debounceCollect(fetchAllDocumentPaths, 1000)

function listenFields(id: Id, fields: FieldName[]) {
  return listen(id)
    .switchMap(
      event =>
        event.type === 'welcome'
          ? fetchDocumentPathsFast(id, fields)
          : fetchDocumentPathsSlow(id, fields)
    )
    .mergeMap(
      result =>
        result === undefined
          ? // hack: if we get undefined as result here it is most likely because the document has
            // just been created and is not yet indexed. We therefore need to wait a bit and then re-fetch.
            fetchDocumentPathsSlow(id, fields)
          : Observable.of(result)
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
  const changes$ = new Observable(observer => {
    observer.next(latest)
    observer.complete()
  })
    .filter(Boolean)
    .merge(listenFields(id, fields))
    .do(v => (latest = v))
    .publishReplay()
    .refCount()

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

  return Observable.combineLatest(cachedFieldObservers)
    .map(snapshots => pickFrom(snapshots, fields))
    .distinctUntilChanged((prev, current) => fields.every(field => prev[field] === current[field]))
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
