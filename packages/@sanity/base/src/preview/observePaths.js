import client from 'part:@sanity/base/client'
import Observable from '@sanity/observable'
import {set} from 'lodash'

const globalListener = Observable
  .from(client.listen('*[!(_id in path("_.**"))]', {}, {includeResult: false}))
  .share()

function unprefixType(typeName) {
  return typeName.split('.').slice().pop()
}

function debounceAccumulate(fn, wait) {
  let timer
  let pendingArgs = []
  let observable = null
  let observer = null
  return function (...args) {
    const index = pendingArgs.push(args) - 1
    if (!observable) {
      observable = new Observable(o => {
        observer = o
      }).share()
    }
    clearTimeout(timer)
    timer = setTimeout(flush, wait)
    return observable.map(value => value[index])
  }
  function flush() {
    const _args = pendingArgs
    const _observer = observer
    pendingArgs = []
    observer = null
    observable = null
    fn(_args).subscribe(_observer)
  }
}

function listen(id) {
  return new Observable(observer => {
    observer.next({type: 'welcome', documentId: id})
    return globalListener
      .filter(event => event.documentId === id)
      .debounceTime(2000)
      .subscribe(observer)
  })
}

function reproject(result, paths) {
  const {_id, _type, ...labels} = result
  const res = {_id, _type: unprefixType(_type)}
  Object.keys(labels).forEach((label, i) => {
    set(res, paths[i], labels[`_f_${i}`])
  })
  return res
}

function fetchAllDocumentSnapshots(selections) {
  const optimizedParams = {}
  const queryParts = selections.map(([id, paths], queryIndex) => {
    optimizedParams[[`id_${queryIndex}`]] = id
    const labeledFields = paths.map((path, i) => `"_f_${i}": ${path.join('.')}`)
    return `*[_id==$id_${queryIndex}]{_id,_type,${labeledFields.join(',')}}`
  })

  const optimizedQuery = `[${queryParts.join(',\n')}]`

  return client.observable.fetch(optimizedQuery, optimizedParams)
    .map((result, index) => {
      return result.map(res => {
        return reproject(res[0], selections[index][1])
      })
    })
}

const debouncedFetchDocumentSnapshot = debounceAccumulate(fetchAllDocumentSnapshots, 50)

export default function observePaths(id, paths) {
  return listen(id)
    .switchMap(event => debouncedFetchDocumentSnapshot(id, paths))
}
