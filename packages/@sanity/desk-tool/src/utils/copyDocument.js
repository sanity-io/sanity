import {isObject, omit} from 'lodash'

function copyReference(reference) {
  return Object.assign({}, reference)
}

function copyObject(object, options = {}) {
  return Object.keys(object).reduce((copy, key) => {
    copy[key] = copyAny(object[key], options)
    return copy
  }, {})
}

function copyArray(array, options = {}) {
  return array.map(item => copyAny(item, options)).filter(Boolean)
}

const COPY_AS_IS = ['number', 'string', 'boolean']

function isReference(value) {
  return (
    value._type === 'reference' ||
    // should not happen as all references should have _type === 'reference'
    (!('_type' in value) && '_ref' in value)
  )
}

function copyAny(value, options) {
  if (Array.isArray(value)) {
    return copyArray(value, options)
  }
  const type = typeof value
  if (COPY_AS_IS.includes(type)) {
    return value
  }
  if (!value) {
    return value
  }

  if (isObject(value)) {
    if (isReference(value)) {
      return options.excludeReferences ? undefined : copyReference(value)
    }
    return copyObject(value, options)
  }
  return value
}

export default function copyDocument(doc, options = {}) {
  return copyAny(omit(doc, '_id'), options)
}
