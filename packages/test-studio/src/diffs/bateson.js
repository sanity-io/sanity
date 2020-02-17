/* eslint-disable max-depth, id-length */
import {difference, intersection} from 'lodash'

const context = {
  differs: {
    block: (a, b) => {
      const aText = extractText(a.children)
      const bText = extractText(b.children)
      if (aText !== bText) {
        return [
          {
            op: 'textEdit',
            type: 'block',
            from: aText,
            to: bText
          }
        ]
      }
      return []
    },
    string: (a, b) => {
      return [
        {
          op: 'textEdit',
          type: 'string',
          from: a,
          to: b
        }
      ]
    },
    image: (a, b) => {
      if (a.asset && b.asset && a.asset._ref !== b.asset._ref) {
        return [{op: 'replaceImage', from: a.asset._ref, to: b.asset._ref}]
      }
      return []
    }
  },
  ignore: ['_updatedAt', '_createdAt', '_rev', '_weak']
}

function typeOf(value) {
  if (Array.isArray(value)) return 'array'
  if (typeof value === 'object') return 'object'
  if (value === null || value === undefined) return 'null'
  return typeof value
}

function isSameType(a, b) {
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

function diff(ctx, path, a, b) {
  if (!isSameType(a, b)) {
    return [{op: 'replace', from: a, to: b}]
  }

  switch (typeOf(a)) {
    case 'object': {
      const result = []
      if (context.differs[a._type]) {
        return context.differs[a._type](a, b)
        result.push(...context.differs[a._type](a, b))
      }
      const [aFields, bFields] = [
        difference(Object.keys(a), context.ignore || []),
        difference(Object.keys(b), context.ignore || [])
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
        const changes = diff(ctx, path.concat(field), fieldA, fieldB)
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
        const changes = diff(ctx, path.concat(key), elementA, elementB)
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
        if (context.differs[typeOf(a)]) {
          return context.differs[typeOf(a)](a, b)
        }
        return [{op: 'edit', from: a, to: b}]
      }
      return []
  }
}

function extractText(blockContent) {
  return blockContent
    .map(item => (item._type == 'span' ? item.text : null))
    .filter(Boolean)
    .join(' ')
}

export default function bateson(a, b) {
  return diff(context, [], a, b)
}
