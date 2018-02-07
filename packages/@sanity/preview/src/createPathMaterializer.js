import {isArray, isObject, uniq} from 'lodash'
import Observable from '@sanity/observable'
import {configure} from 'observable-props'

const props = configure({Observable})

function isReference(value) {
  return '_ref' in value
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

function resolveMissingHeads(value, paths) {
  return paths.filter(path => !(path[0] in value))
}

export default function createPathMaterializer(observeWithPaths) {
  return function materializePaths(value, paths) {
    if (!isArray(value) && !isObject(value)) {
      // Reached a leaf. Don't blow up
      return Observable.of(value)
    }
    const missingHeads = resolveMissingHeads(value, paths)
    if (missingHeads.length > 0) {
      // Reached a node that is either a document (with _id), or a reference (with _ref) that
      // needs to be "materialized"

      const nextHeads = uniq(missingHeads.map(path => [path[0]]))

      const isRef = isReference(value)
      if (isReference(value) || isDocument(value)) {
        const id = isRef ? value._ref : value._id
        return observeWithPaths(id, nextHeads).switchMap(snapshot => {
          return materializePaths({
              ...createEmpty(nextHeads),
              ...(isRef ? {} : value),
              ...snapshot
            }, paths)
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

    const next = Object.keys(leads).reduce((res, head) => {
      const tails = leads[head]
      if (tails.every(tail => tail.length === 0)) {
        res[head] = value[head]
      } else {
        res[head] = materializePaths(value[head], tails)
      }
      return res
    }, {...value})

    return props(Observable.of(next), {wait: true})
  }
}
