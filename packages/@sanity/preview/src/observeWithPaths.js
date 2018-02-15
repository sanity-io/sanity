import client from 'part:@sanity/base/client'
import Observable from '@sanity/observable'
import debounceCollect from './utils/debounceCollect'
import {combineSelections, reassemble, toGradientQuery} from './utils/optimizeQuery'

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

function fetchAllDocumentPaths(selections) {
  const combinedSelections = combineSelections(selections)
  return client.observable
    .fetch(toGradientQuery(combinedSelections))
    .map(result => reassemble(result, combinedSelections))
}

const fetchDocumentPathsFast = debounceCollect(fetchAllDocumentPaths, 0)
const fetchDocumentPathsSlow = debounceCollect(fetchAllDocumentPaths, 1000)

// todo: keep for debugging purposes for now
// function fetchDocumentPaths(id, selection) {
//   return client.observable.fetch(`*[_id==$id]{_id,_type,${selection.join(',')}}`, {id})
//     .map(result => result[0])
// }

export default function observeWithPaths(id, paths) {
  return fetchDocumentPathsFast(id, paths).concat(
    listen(id).switchMap(event => fetchDocumentPathsSlow(id, paths))
  )
}
