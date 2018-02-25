// @flow
import client from 'part:@sanity/base/client'
import Observable from '@sanity/observable'
import debounceCollect from './utils/debounceCollect'
import {combineSelections, reassemble, toGradientQuery} from './utils/optimizeQuery'
import {flatten, difference} from 'lodash'
import type {FieldName, Id} from './types'

let _globalListener
const getGlobalListener = () => {
  if (!_globalListener) {
    _globalListener = Observable.from(
      client.listen('*[!(_id in path("_.**"))]', {}, {includeResult: false})
    ).share()
  }
  return _globalListener
}

function listen(id) {
  return getGlobalListener().filter(event => event.documentId === id)
}

function fetchAllDocumentPaths(selections: Selection[]) {
  const combinedSelections = combineSelections(selections)
  return client.observable
    .fetch(toGradientQuery(combinedSelections))
    .map(result => reassemble(result, combinedSelections))
}

const fetchDocumentPathsFast = debounceCollect(fetchAllDocumentPaths, 0)
const fetchDocumentPathsSlow = debounceCollect(fetchAllDocumentPaths, 1200)

function listenFields(id: Id, fields: FieldName[]) {
  // console.log('listening on doc #%s for fields %O', id, fields)
  return fetchDocumentPathsFast(id, fields).concat(
    listen(id).switchMap(event => fetchDocumentPathsSlow(id, fields))
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
    if (latest) {
      // Re-emit last known value immediately
      observer.next(latest)
    }
    return listenFields(id, fields).subscribe(observer)
  })
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
    .map(snapshots => Object.assign({}, ...snapshots))
    .distinctUntilChanged((prev, current) => fields.every(field => prev[field] === current[field]))
}
