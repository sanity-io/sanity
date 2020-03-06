/* eslint-disable complexity */
/* eslint-disable max-depth, id-length */
import difference from 'lodash/difference'
import intersection from 'lodash/intersection'
import flattenDeep from 'lodash/flattenDeep'

const defaultOptions: BatesonOptions = {
  ignoreFields: ['_id', '_updatedAt', '_createdAt', '_rev', '_weak']
}

function typeOf(value): string {
  if (Array.isArray(value)) return 'array'
  if (typeof value === 'object') return 'object'
  if (value === null || value === undefined) return 'null'
  return typeof value
}

export function isSameType(a: any, b: any): boolean {
  if (a === null && b === null) return true
  if (a === null && b !== null) return false
  if (a !== null && b === null) return false
  if (typeof a !== typeof b) return false
  if (typeof a === 'object' && a._type !== b._type) return false
  return true
}

function sanityType(value): string {
  if (value._type) return value._type
  return typeOf(value)
}

function accumulateChangeSummaries(a: any, b: any, path: string[], options: BatesonOptions): Operation[] {
  if (!isSameType(a, b)) {
    return [{operation: 'replace', from: a, to: b}]
  }

  const typeWeAreOperatingOn = typeOf(a) // We can use this, as a and b are guaranteed to be the same type
  switch (typeWeAreOperatingOn) {
    case 'object': {
      const result = []
      const summarizerForTypeOperation = options.summarizers[sanityType(a)]
      const summary = summarizerForTypeOperation
        ? summarizerForTypeOperation.resolve(a, b, path)
        : null

      let ignoreFields = options.ignoreFields || []

      if (summary && summary.changes) {
        if (summary.fields.length === 0) {
          // An empty fields array means the whole thing has been handled
          return summary.changes.map(change => ({
            ...change,
            // TODO: Decide on path format
            path
          }))
        }
        ignoreFields = summary.fields.concat(ignoreFields)

        summary.changes.forEach(change => {
          result.push({
            ...change,
            path
          })
        })
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
        result.push({operation: 'add', path: path.concat({_key: key}), to: bElements[key]})
      })

      // something has been removed
      difference(aKeys, bKeys).forEach(key => {
        result.push({operation: 'remove', path: path.concat({_key: key}), from: aElements[key]})
      })

      return result
    }

    default:
      if (a !== b) {
        const summarizerForTypeOperation = options.summarizers[sanityType(a)]
        const summary = summarizerForTypeOperation
          ? summarizerForTypeOperation.resolve(a, b, path)
          : null

        if (summary && summary.changes) {
          return summary.changes.map(change => {
            // TODO: Use another type to specify Operation with path field?
            change.path = path
            return change
          })
        }

        // TODO: Use another type to specify Operation with path field?
        return [{operation: 'edit', path, from: a, to: b}]
      }
      return []
  }
}

export default function changeSummaries(a: any, b: any, opts: BatesonOptions = {}) {
  const options = {...defaultOptions, ...opts}
  const nestedSummaries = accumulateChangeSummaries(a, b, [], options)
  return flattenDeep(nestedSummaries)
}

export interface BatesonOptions {
  summarizers?: Summarizers
  ignoreFields?: string[]
}

export interface Summarizers {
  [typeToSummarize: string]: Summarizer
}

export interface Summarizer {
  resolve(a: any, b: any, path: string[]): Summary
}

export interface Summary {
  fields: string[]
  changes: Operation[]
}

export interface Operation {
  operation: string
  path?: string // TODO: Should be required, define another interface with this one?
  from?: any
  to?: any
}

