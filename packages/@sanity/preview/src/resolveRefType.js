import client from 'part:@sanity/base/client'
import Observable from '@sanity/observable'
import type {Reference, Type} from './types'

const CACHE = {} // todo: use a LRU cache instead (e.g. hashlru or quick-lru)

function resolveRefTypeName(reference: Reference) {
  if (!(reference._ref in CACHE)) {
    CACHE[reference._ref] = client.fetch('*[_id == $id][0]._type', {id: reference._ref})
  }
  return Observable.from(CACHE[reference._ref])
}

export default function resolveRefType(value: Reference, type: Type) {
  return resolveRefTypeName(value)
    .map(refTypeName => type.to.find(toType => toType.name === refTypeName))
}
