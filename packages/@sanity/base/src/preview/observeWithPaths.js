import client from 'part:@sanity/base/client'
import Observable from '@sanity/observable'
import debounceCollect from './utils/debounceCollect'

const globalListener = Observable
  .from(client.listen('*[!(_id in path("_.**"))]', {}, {includeResult: false}))
  .share()

function listen(id) {
  return new Observable(observer => {
    observer.next({type: 'welcome', documentId: id})
    return globalListener
      .filter(event => event.documentId === id)
      .debounceTime(2000)
      .subscribe(observer)
  })
}

function fetchAllDocumentSnapshots(selections) {
  const optimizedParams = {}
  const queryParts = selections.map(([id, paths], queryIndex) => {
    optimizedParams[[`id_${queryIndex}`]] = id
    return `*[_id==$id_${queryIndex}]{_id,_type,${paths.join(',')}}`
  })

  const optimizedQuery = `[${queryParts.join(',\n')}]`

  return client.observable.fetch(optimizedQuery, optimizedParams)
    .map(result => result.map(res => res[0]))
}

const debouncedFetchDocumentSnapshot = debounceCollect(fetchAllDocumentSnapshots, 50)

export default function observePaths(id, paths) {
  return listen(id)
    .switchMap(event => debouncedFetchDocumentSnapshot(id, paths))
}
