import {listenQuery} from 'part:@sanity/base/listen-query'
import {withCustomPathSegment} from 'json-reduce'
import {map} from 'rxjs/operators'

const reduce = withCustomPathSegment((item, index, container) =>
  Array.isArray(container) && item && item._key ? {_key: item._key} : index
)

const getPathsToRef = (id, doc) =>
  reduce(
    doc,
    (acc, node, path) => {
      return node && node._ref === id ? [...acc, {path, value: node}] : acc
    },
    []
  )

export function referencedPaths(id) {
  return listenQuery(`*[references($id)]`, {id}).pipe(
    map(docs =>
      docs.map(doc => ({
        document: doc,
        refs: getPathsToRef(id, doc)
      }))
    )
  )
}
