import client from 'part:@sanity/base/client'
import Observable from '@sanity/observable'

const CACHE = {} // todo: use a LRU cache instead (e.g. hashlru or quick-lru)

function resolveRefTypeName(value) {
  if (!(value._ref in CACHE)) {
    CACHE[value._ref] = client.fetch('*[_id == $id][0]._type', {id: value._ref})
  }
  return Observable.from(CACHE[value._ref])
}

export default function resolveRefType(value, type) {
  return resolveRefTypeName(value)
    .map(refTypeName => type.to.find(toType => toType.name === refTypeName))
}
