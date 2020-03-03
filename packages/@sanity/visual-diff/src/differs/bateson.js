/* eslint-disable complexity */
/* eslint-disable max-depth, id-length */
import difference from 'lodash/difference'
import intersection from 'lodash/intersection'
import flattenDeep from 'lodash/flattenDeep'

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
  if (a === null && b === null) return true
  if (a === null && b !== null) return false
  if (a !== null && b === null) return false
  if (typeof a !== typeof b) return false
  if (typeof a === 'object') {
    if (a._type !== b._type) return false
  }
  return true
}

function sanityType(value) {
  if (value._type) return value._type
  return typeOf(value)
}

function summarizerExistForTypeOperation(a, b, type, path, summarizers) {
  const summarizerForTypeOperation = summarizers[type]
  if (summarizerForTypeOperation) {
    const summary = summarizerForTypeOperation.resolve(a, b)
    if (summary) {
      return summary
    }
  }

  return null
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
        sanityType(a),
        path,
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
        result.push({op: 'add', field, value: b[field]})
      })
      const kept = intersection(aFields, bFields)
      kept.forEach(field => {
        const fieldA = a[field]
        const fieldB = b[field]
        const changes = diff(fieldA, fieldB, path.concat(field), options)
        if (changes.length > 0) {
          result.push(changes)
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
        if (changes.length > 0) {
          result.push(changes)
        }
      })

      // something has been added
      difference(bKeys, aKeys).forEach(key => {
        result.push({op: 'set', key, path: `${path}[_key=${key}]`, value: bElements[key]})
      })

      // something has been removed
      difference(aKeys, bKeys).forEach(key => {
        result.push({op: 'remove', key, path: `${path}[_key=${key}]`})
      })

      return result
    }

    default:
      if (a !== b) {
        const summarizerForType = options.summarizers[typeOf(a)]
        if (summarizerForType) {
          const summary = summarizerForType.resolve(a, b)
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
  const nestedChangeSummaries = diff(a, b, [], options)
  return flattenDeep(nestedChangeSummaries)
}
