import {keyBy} from 'lodash'
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

function fetchAllDocumentSnapshots(selections) {
  let prevPaths
  let canBeCombined = true

  const ids = []
  const optimizedParams = {}
  const queryParts = selections.map(([id, paths], queryIndex) => {
    // While we're iterating, see if there are differing paths requested
    const currentPaths = paths.join(',')
    if (canBeCombined && prevPaths && currentPaths !== prevPaths) {
      canBeCombined = false
    }

    ids.push(id)
    prevPaths = currentPaths
    optimizedParams[[`id_${queryIndex}`]] = id
    return `*[_id==$id_${queryIndex}]{_id,_type,${currentPaths}}`
  })

  // If we have different paths (fields selected), we can't combine the queries, so do an array selection
  if (!canBeCombined) {
    const optimizedQuery = `[${queryParts.join(',\n')}]`
    return client.observable
      .fetch(optimizedQuery, optimizedParams)
      .map(result => result.map(res => res[0]))
  }

  // All paths (fields selected) are the same, so we can create a simpler, faster query
  // Note that we have to reassemble results into same order as the input, however
  const query = `*[_id in [${ids.map(id => JSON.stringify(id)).join(',')}]]{_id,_type,${prevPaths}}`
  return client.observable.fetch(query).map(result => {
    const byId = keyBy(result, '_id')
    return selections.map(([id]) => byId[id])
  })
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
