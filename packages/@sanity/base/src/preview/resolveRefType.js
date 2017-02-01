import client from 'part:@sanity/base/client'

function removeSchemaPrefix(type) {
  return type.split('.').pop()
}
function resolveRefTypeName(value) {
  if (value._type.includes(':')) {
    return value._type.split(':').pop()
  }
  return client.fetch('*[_id == $id]{_type}', {id: value._ref})
    .then(result => removeSchemaPrefix(result[0]._type))
}

export default function resolveRefType(value, type) {
  return resolveRefTypeName(value, type)
    .then(refTypeName =>
      type.to.find(toType => toType.name === refTypeName)
    )
}
