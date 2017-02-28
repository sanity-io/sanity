import {has, isObject, isArray} from 'lodash'
import Observable from '@sanity/observable'
import {create} from 'observable-props'

const props = create(Observable)

function resolveMissingPaths(value, paths) {
  return paths.filter(path => !has(value, path))
}
function isReference(value) {
  return value._type === 'reference'
    // should not happen as all references should have _type === 'reference'
    || (!('_type' in value) && ('_ref' in value))
}

export default function createPreviewObserver(observeWithPaths) {

  function follow(value, paths) {
    if (!isArray(value) && !isObject(value)) {
      // Reached a leaf. Don't blow up
      return Observable.of(value)
    }
    if (isReference(value)) {
      const heads = paths.map(path => [path[0]])
      const tails = paths.map(path => path.slice(1))
      return observeWithPaths(value._ref, heads).mergeMap(doc => follow(doc, tails))
    }

    const leads = {}
    paths.forEach(path => {
      const [head, ...tail] = path
      if (!leads[head]) {
        leads[head] = []
      }
      leads[head].push(tail)
    })

    return props(Object.keys(leads).reduce((res, head) => {
      const tails = leads[head]
      if (tails.every(tail => tail.length === 0)) {
        res[head] = value[head]
      } else {
        res[head] = follow(value[head] || {}, tails)
      }
      return res
    }, {...value}))
  }

  return function observe(value, paths) {
    const missingPaths = resolveMissingPaths(value, paths)
    if (missingPaths.length === 0) {
      return follow(value, paths)
    }
    const id = isReference(value) ? value._ref : value._id
    if (id) {
      const heads = missingPaths.map(path => [path[0]])

      return observeWithPaths(id, heads)
        .mergeMap(doc => follow({...value, ...doc}, missingPaths))
    }

    // No id means we are at a inline object. There still might be paths that needs fetching
    return follow(value, missingPaths)

  }
}
