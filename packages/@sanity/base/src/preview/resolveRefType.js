import client from 'part:@sanity/base/client'
import Observable from '@sanity/observable'

function removeSchemaPrefix(type) {
  return type.split('.').pop()
}

function resolveRefTypeName(value) {
  if (value._type.includes(':')) {
    return Observable.of(value._type.split(':').pop())
  }
  return Observable.from(client.observable.fetch('*[_id == $id]{_type}', {id: value._ref}))
    .map(result => removeSchemaPrefix(result[0]._type)
  )
}

export default function resolveRefType(value, type) {
  return resolveRefTypeName(value)
    .map(refTypeName => type.to.find(toType => toType.name === refTypeName))
}
