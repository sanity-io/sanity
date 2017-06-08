import {uniq, isObject, isArray} from 'lodash'
import Observable from '@sanity/observable'
import {configure} from 'observable-props'

const props = configure({Observable})

function resolveMissingHeads(value, paths) {
  return paths.filter(path => !(path[0] in value))
}

function isReference(value) {
  return value._type === 'reference'
    // should not happen as all references should have _type === 'reference'
    || (!('_type' in value) && ('_ref' in value))
}

function isDocument(value) {
  return '_id' in value
}

function createEmpty(keys) {
  return keys.reduce((result, key) => {
    result[key] = undefined
    return result
  }, {})
}

export default function createPreviewObserver(observeWithPaths) {

  function follow(value, paths) {
    if (!isArray(value) && !isObject(value)) {
      // Reached a leaf. Don't blow up
      return Observable.of(value)
    }
    const missingHeads = resolveMissingHeads(value, paths)
    if (missingHeads.length > 0) {
      // Reached a node that is either a document (with _id), or a reference (with _ref) that
      // needs to be "materialized"

      const nextHeads = uniq(missingHeads.map(path => [path[0]]))

      if (isReference(value) || isDocument(value)) {
        const id = isReference(value) ? value._ref : value._id
        return observeWithPaths(id, nextHeads).switchMap(snapshot => {
          return follow({...createEmpty(nextHeads), ...value, ...snapshot}, paths)
        })
      }
    }

    const leads = {}
    paths.forEach(path => {
      const [head, ...tail] = path
      if (!leads[head]) {
        leads[head] = []
      }
      leads[head].push(tail)
    })

    return props(Observable.of(Object.keys(leads).reduce((res, head) => {
      const tails = leads[head]
      if (tails.every(tail => tail.length === 0)) {
        res[head] = value[head]
      } else if (value[head]) {
        res[head] = follow(value[head], tails)
      }
      return res
    }, {...value})), {wait: true})
  }

  return follow
}
