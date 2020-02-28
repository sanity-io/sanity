/* eslint-disable complexity */
/* eslint-disable max-depth, id-length */
// TODO: Make importing less bloated
import {difference, intersection} from 'lodash'

const defaultOptions = {
  ignoreFields: ['_id', '_updatedAt', '_createdAt', '_rev', '_weak']
}

function typeOf(value) {
  if (Array.isArray(value)) return 'array'
  if (typeof value === 'object') return 'object'
  if (value === null || value === undefined) return 'null'
  return typeof value
}

export function isSameType(a, b) {
  if (typeof a !== typeof b) return false
  if (Array.isArray(a) && Array.isArray(b)) return true
  if (a === null && b === null) return true
  if (typeof a === 'object') {
    if (a._type !== b._type) return false
  }
  return true
}

function sanityType(value) {
  if (value._type) return value._type
  return typeOf(value)
}

function summarizerExistForTypeOperation(a, b, type, summarizers) {
  const summarizerForTypeOperation = summarizers[type]
  if (summarizerForTypeOperation) {
    const summary = summarizerForTypeOperation(a, b)
    if (summary) {
      return summary
    }
  }

  return undefined
}

function diff(a, b, path, options) {
  if (!isSameType(a, b)) {
    return [{op: 'replace', from: a, to: b}]
  }

  const typeWeAreOperatingOn = typeOf(a) // We can use this, as a and b are guaranteed to be the same type

  switch (typeWeAreOperatingOn) {
    case 'object': {
      const result = []

      const summarizerForTypeOperation = summarizerExistForTypeOperation(
        a,
        b,
        typeWeAreOperatingOn,
        options.summarizers
      )
      if (summarizerForTypeOperation) {
        //  There might be a differ for this type, but maybe not for every operation imaginable
        return summarizerForTypeOperation
      }

      const [aFields, bFields] = [
        difference(Object.keys(a), options.ignoreFields || []),
        difference(Object.keys(b), options.ignoreFields || [])
      ]
      const removed = difference(aFields, bFields)
      removed.forEach(field => {
        result.push({op: 'remove', field})
      })
      const added = difference(bFields, aFields)
      added.forEach(field => {
        result.push({op: 'set', field, value: b[field]})
      })
      const kept = intersection(aFields, bFields)
      kept.forEach(field => {
        const fieldA = a[field]
        const fieldB = b[field]
        const changes = diff(fieldA, fieldB, path.concat(field), options)
        const type = isSameType(fieldA, fieldB) ? sanityType(fieldA) : null
        if (changes.length > 0) {
          result.push({op: 'modifyField', type, field, changes})
        }
      })

      return result
    }

    case 'array': {
      const result = []
      const aElements = {}
      const bElements = {}
      a.forEach(element => {
        aElements[element._key] = element
      })
      b.forEach(element => {
        bElements[element._key] = element
      })
      const [aKeys, bKeys] = [Object.keys(aElements), Object.keys(bElements)]

      intersection(aKeys, bKeys).forEach(key => {
        const elementA = aElements[key]
        const elementB = bElements[key]
        const changes = diff(elementA, elementB, path.concat(key), options)
        const type = isSameType(elementA, elementB) ? sanityType(elementA) : null
        if (changes.length > 0) {
          result.push({op: 'modifyEntry', type, key, changes})
        }
      })
      difference(bKeys, aKeys).forEach(key => {
        result.push({op: 'remove', key})
      })
      return result
    }

    default:
      if (a !== b) {
        const summarizerForType = options.summarizers[typeOf(a)]
        if (summarizerForType) {
          const summary = summarizerForType(a, b)
          if (summary) {
            return summary
          }
        }
        return [{op: 'edit', from: a, to: b}]
      }
      return []
  }
}

export default function bateson(a, b, opts = {}) {
  const options = {...defaultOptions, ...opts}
  return diff(a, b, [], options)
}
