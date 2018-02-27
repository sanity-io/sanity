// @flow
import client from 'part:@sanity/base/client'
import Observable from '@sanity/observable'
import idb from 'idb-keyval'
import {flatten, difference} from 'lodash'
import debounceCollect from './utils/debounceCollect'
import {combineSelections, reassemble, toGradientQuery} from './utils/optimizeQuery'
import type {FieldName, Id} from './types'
import {INCLUDE_FIELDS} from './constants'
import arrify from './utils/arrify'
import hasEqualFields from './utils/hasEqualFields'
import isUniqueBy from './utils/isUniqueBy'

const ROOT_KEY = '__sanity__preview__cache__'
const UNDEFINED = '__$undefined$__'

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
  return listen(id).switchMap(event => {
    if (event.type === 'welcome') {
      return fetchDocumentPathsFast(id, fields).mergeMap(result => {
        return result === undefined
          ? // hack: if we get undefined as result here it is most likely because the document has
            // just been created and is not yet indexed. We therefore need to wait a bit and then re-fetch.
            fetchDocumentPathsSlow(id, fields)
          : Observable.of(result)
      })
    }
    return fetchDocumentPathsSlow(id, fields)
  })
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

function keyFor(id) {
  return `${ROOT_KEY}-${id}`
}

function mapValues(object, replacer) {
  return Object.keys(object).reduce((acc, key) => {
    acc[key] = replacer(object[key])
    return acc
  }, {})
}

function getCachedSnapshot(id) {
  return Observable.from(idb.get(keyFor(id))).map(
    cacheVal =>
      cacheVal ? mapValues(cacheVal, value => (value === UNDEFINED ? undefined : value)) : cacheVal
  )
}

function updateCache(id, document) {
  const prepared = document
    ? mapValues(document, value => (value === undefined ? UNDEFINED : value))
    : null
  return Observable.from(idb.set(keyFor(id), prepared))
}

function createCachedFieldObserver(id, fields): CachedFieldObserver {
  return {
    id,
    fields,
    changes$: listenFields(id, fields)
      .publishReplay(1)
      .refCount()
  }
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

  const sharedFieldObservers = existingObservers
    .filter(observer => observer.fields.some(fieldName => fields.includes(fieldName)))
    .map(cached => cached.changes$)

  return (
    getCachedSnapshot(id)
      .do(cached => console.log('CACHE %s', cached ? 'HIT' : 'MISS', cached))
      .filter(Boolean)
      // .filter(hasFields(fields)) // todo: store fields that are retrieved, but has no value in indexed db
      .map(arrify)
      .concat(
        Observable.combineLatest(sharedFieldObservers)
          // in the event that a document gets deleted, the cached values will be updated to store `undefined`
          // if this happens, we should not pick any fields from it, but rather just return null
          .map(snapshots => snapshots.filter(Boolean))
          // make sure all snapshots agree on same revision
          .filter(snapshots => isUniqueBy(snapshots, snapshot => snapshot._rev))
          .do(snapshots => {
            // console.log(snapshots)
            const entry =
              snapshots.length === 0 ? null : Object.assign({__fromCache: true}, ...snapshots)
            console.log('CACHE SET %s', id, entry)
            updateCache(id, entry)
          })
      )
      // pass on value with the requested fields (or null if value is deleted)
      // .do(console.log)
      .map(snapshots => (snapshots.length === 0 ? null : pickFrom(snapshots, fields)))
      // emit values only if changed
      .distinctUntilChanged(hasEqualFields(fields))
    // .do(console.log)
  )
}

function hasFields(fields) {
  return document => fields.every(field => field in document)
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
