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

function resolveSummarizerForType(a, b, type, path, summarizers) {
  const summarizerForTypeOperation = summarizers[type]
  return summarizerForTypeOperation ? summarizerForTypeOperation.resolve(a, b, path) : null
}

function accumulateChangeSummaries(a, b, path, options) {
  if (!isSameType(a, b)) {
    return [{operation: 'replace', from: a, to: b}]
  }

  const typeWeAreOperatingOn = typeOf(a) // We can use this, as a and b are guaranteed to be the same type

  switch (typeWeAreOperatingOn) {
    case 'object': {
      const result = []

      const summarizerForType = resolveSummarizerForType(
        a,
        b,
        sanityType(a),
        path,
        options.summarizers
      )

      let ignoreFields = options.ignoreFields || []

      if (summarizerForType && summarizerForType.changes) {
        ignoreFields = summarizerForType.fields.concat(ignoreFields)
        if (summarizerForType.fields.length === 0) {
          // An empty fields array means the whole thing has been handled
          return summarizerForType.changes
        }
        result.concat(
          summarizerForType.changes.map(change => {
            change.path = path
            return change
          })
        )
      }

      const [aFields, bFields] = [
        difference(Object.keys(a), ignoreFields),
        difference(Object.keys(b), ignoreFields)
      ]

      const removed = difference(aFields, bFields)
      removed.forEach(field => {
        result.push({operation: 'remove', path, from: a[field]})
      })

      const added = difference(bFields, aFields)
      added.forEach(field => {
        result.push({operation: 'add', path, to: b[field]})
      })

      const kept = intersection(aFields, bFields)
      kept.forEach(field => {
        const fieldA = a[field]
        const fieldB = b[field]
        const changes = accumulateChangeSummaries(fieldA, fieldB, path.concat(field), options)
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
        const changes = accumulateChangeSummaries(elementA, elementB, path.concat(key), options)
        if (changes.length > 0) {
          result.push(changes)
        }
      })

      // something has been added
      difference(bKeys, aKeys).forEach(key => {
        result.push({operation: 'add', key, path, to: bElements[key]})
      })

      // something has been removed
      difference(aKeys, bKeys).forEach(key => {
        result.push({operation: 'remove', key, path, from: aElements[key]})
      })

      return result
    }

    default:
      if (a !== b) {
        const summarizerForType = resolveSummarizerForType(
          a,
          b,
          sanityType(a),
          path,
          options.summarizers
        )

        if (summarizerForType && summarizerForType.changes) {
          return summarizerForType.changes.map(change => {
            change.path = path
            return change
          })
        }

        return [{operation: 'edit', path, from: a, to: b}]
      }
      return []
  }
}

export default function changeSummaries(a, b, opts = {}) {
  const options = {...defaultOptions, ...opts}
  const nestedSummaries = accumulateChangeSummaries(a, b, [], options)
  return flattenDeep(nestedSummaries)
}
