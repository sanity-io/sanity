import {values, sortBy, identity} from 'lodash'
import client from 'part:@sanity/base/client'
import Observable from '@sanity/observable'
import debounceCollect from './utils/debounceCollect'

let _globalListener
const getGlobalListener = () => {
  if (!_globalListener) {
    _globalListener = Observable
      .from(client.listen('*[!(_id in path("_.**"))]', {}, {includeResult: false}))
      .share()
  }
  return _globalListener
}

function listen(id) {
  return Observable.of({type: 'welcome', documentId: id})
    .concat(getGlobalListener())
    .filter(event => event.documentId === id)
}

function combineSelections(selections) {
  return values(selections.reduce((output, [id, paths], index) => {
    const key = sortBy(paths.join(','), identity)
    if (!output[key]) {
      output[key] = {paths, ids: [], map: []}
    }
    const idx = output[key].ids.length
    output[key].ids[idx] = id
    output[key].map[idx] = index
    return output
  }, {}))
}

function stringifyId(id) {
  return JSON.stringify(id)
}
function toSubQuery({ids, paths}) {
  const stringifiedIds = ids.map(stringifyId)
  const filter = stringifiedIds.length === 1
    ? `*[_id == ${stringifiedIds[0]}]`
    : `*[_id in [${stringifiedIds.join(',')}]]`
  return `${filter}{_id,_type,${paths.join(',')}}`
}

function toGradientQuery(combinedSelections) {
  const subQueries = combinedSelections.map(toSubQuery)
  return `[${subQueries.join(',')}]`
}

function reproject(queryResult, combinedSelections) {
  return queryResult.reduce((reprojected, subResult, index) => {
    const map = combinedSelections[index].map
    map.forEach((resultIdx, i) => {
      const id = combinedSelections[index].ids[i]
      reprojected[resultIdx] = subResult.find(doc => doc._id === id)
    })
    return reprojected
  }, [])
}

function fetchAllDocumentSnapshots(selections) {
  const combinedSelections = combineSelections(selections)
  return client.observable
    .fetch(toGradientQuery(combinedSelections))
    .map(result => reproject(result, combinedSelections))
}

const debouncedFetchDocumentSnapshot = debounceCollect(fetchAllDocumentSnapshots, 50)

// todo: keep for debugging purposes for now
// function fetchDocumentSnapshot(id, selection) {
//   return client.observable.fetch(`*[_id==$id]{_id,_type,${selection.join(',')}}`, {id})
//     .map(result => result[0])
// }

export default function observeWithPaths(id, paths) {
  return debouncedFetchDocumentSnapshot(id, paths)
    .concat(listen(id)
      .debounceTime(1000)
      .switchMap(event => debouncedFetchDocumentSnapshot(id, paths)))
}
