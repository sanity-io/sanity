import client from 'part:@sanity/base/client'
import Observable from '@sanity/observable'

function resolveRefTypeName(value) {
  return Observable.from(client.observable.fetch('*[_id == $id][0]._type', {id: value._ref}))
}

export default function resolveRefType(value, type) {
  return resolveRefTypeName(value)
    .map(refTypeName => type.to.find(toType => toType.name === refTypeName))
}
