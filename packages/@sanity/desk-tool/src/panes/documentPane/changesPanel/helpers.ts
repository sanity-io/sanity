import {Diff, ObjectDiff, Path, ArrayDiff} from '@sanity/field/diff'
import {SchemaType} from '../types'
import {ArrayItemMetadata} from './types'

const toString = Object.prototype.toString
// Copied from https://github.com/ForbesLindesay/type-of, but inlined to have fine grained control

// eslint-disable-next-line complexity
export function resolveJSType(val) {
  switch (toString.call(val)) {
    case '[object Function]':
      return 'function'
    case '[object Date]':
      return 'date'
    case '[object RegExp]':
      return 'regexp'
    case '[object Arguments]':
      return 'arguments'
    case '[object Array]':
      return 'array'
    case '[object String]':
      return 'string'
    default:
  }

  if (typeof val == 'object' && val && typeof val.length == 'number') {
    try {
      // eslint-disable-next-line max-depth
      if (typeof val.callee == 'function') {
        return 'arguments'
      }
    } catch (ex) {
      // eslint-disable-next-line max-depth
      if (ex instanceof TypeError) {
        return 'arguments'
      }
    }
  }

  if (val === null) {
    return 'null'
  }

  if (val === undefined) {
    return 'undefined'
  }

  if (val && val.nodeType === 1) {
    return 'element'
  }

  if (val === Object(val)) {
    return 'object'
  }

  return typeof val
}

export function resolveTypeName(value) {
  const jsType = resolveJSType(value)
  return (jsType === 'object' && '_type' in value && value._type) || jsType
}

export function getDiffAtPath(diff: ObjectDiff, path: Path): Diff | null {
  let node: Diff = diff

  for (const pathSegment of path) {
    if (node.type === 'object' && typeof pathSegment === 'string') {
      node = node.fields[pathSegment]
      // eslint-disable-next-line max-depth
      if (!node) return null
    } else {
      throw new Error(
        `Mismatch between path segment (${typeof pathSegment}) and diff type (${diff.type})`
      )
    }
  }

  return node
}

// @todo: typings
function resolveArrayOfType(field: any, value: any): any | null {
  const typeName = resolveTypeName(value)

  return field.type.of.find(t => t.name === typeName) || null
}

export function getArrayDiffItemTypes(diff: ArrayDiff, field: SchemaType): ArrayItemMetadata[] {
  return diff.items.map(diffItem => {
    if (diffItem.diff.action === 'added') {
      return {
        toType: resolveArrayOfType(field, diffItem.diff.toValue)
      }
    } else if (diffItem.diff.action === 'changed') {
      return {
        fromType: resolveArrayOfType(field, diffItem.diff.fromValue),
        toType: resolveArrayOfType(field, diffItem.diff.toValue)
      }
    } else if (diffItem.diff.action === 'removed') {
      return {
        fromType: resolveArrayOfType(field, diffItem.diff.fromValue)
      }
    }

    // unchanged
    return {
      toType: resolveArrayOfType(field, diffItem.diff.toValue)
    }
  })
}
