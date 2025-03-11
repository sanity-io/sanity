import {
  isIndexSegment,
  isKeySegment,
  isReferenceSchemaType,
  type ObjectField,
  type ObjectFieldType,
  type ObjectSchemaType,
  type SanityDocumentLike,
  type SchemaType,
} from '@sanity/types'
import * as PathUtils from '@sanity/util/paths'
import {type ExprNode, parse} from 'groq-js'
import {collate, getPublishedId} from 'sanity'

import {type DocumentListPaneItem, type SortOrder} from './types'

export function getDocumentKey(value: DocumentListPaneItem, index: number): string {
  return value._id ? getPublishedId(value._id) : `item-${index}`
}

export function removePublishedWithDrafts(documents: SanityDocumentLike[]): DocumentListPaneItem[] {
  return collate(documents).map((entry) => {
    const doc = entry.draft || entry.published || entry.versions[0]
    const hasDraft = Boolean(entry.draft)

    return {
      ...doc,
      hasPublished: !!entry.published,
      hasDraft,
    }
  }) as any
}

export function applyOrderingFunctions(order: SortOrder, schemaType: ObjectSchemaType): SortOrder {
  const orderBy = order.by.map((by) => {
    // Skip those that already have a mapper
    if (by.mapWith) {
      return by
    }

    const fieldType = tryResolveSchemaTypeForPath(schemaType, by.field)
    if (!fieldType) {
      return by
    }

    // Note: order matters here, since the jsonType of a date field is `string`,
    // but we want to apply `datetime()`, not `lower()`
    if (fieldExtendsType(fieldType, 'datetime')) {
      return {...by, mapWith: 'dateTime'}
    }

    if (fieldType.jsonType === 'string') {
      return {...by, mapWith: 'lower'}
    }

    return by
  })

  return orderBy.every((item, index) => item === order.by[index]) ? order : {...order, by: orderBy}
}

function tryResolveSchemaTypeForPath(baseType: SchemaType, path: string): SchemaType | undefined {
  const pathSegments = PathUtils.fromString(path)

  let current: SchemaType | undefined = baseType
  for (const segment of pathSegments) {
    if (!current) {
      return undefined
    }

    if (typeof segment === 'string') {
      current = getFieldTypeByName(current, segment)
      continue
    }

    const isArrayAccessor = isKeySegment(segment) || isIndexSegment(segment)
    if (!isArrayAccessor || current.jsonType !== 'array') {
      return undefined
    }

    const [memberType, otherType] = current.of || []
    if (otherType || !memberType) {
      // Can't figure out the type without knowing the value
      return undefined
    }

    if (!isReferenceSchemaType(memberType)) {
      current = memberType
      continue
    }

    const [refType, otherRefType] = memberType.to || []
    if (otherRefType || !refType) {
      // Can't figure out the type without knowing the value
      return undefined
    }

    current = refType
  }

  return current
}

function getFieldTypeByName(type: SchemaType, fieldName: string): SchemaType | undefined {
  if (!('fields' in type)) {
    return undefined
  }

  const fieldType = type.fields.find((field) => field.name === fieldName)
  return fieldType ? fieldType.type : undefined
}

export function fieldExtendsType(field: ObjectField | ObjectFieldType, ofType: string): boolean {
  let current: SchemaType | undefined = field.type
  while (current) {
    if (current.name === ofType) {
      return true
    }

    if (!current.type && current.jsonType === ofType) {
      return true
    }

    current = current.type
  }

  return false
}

/**
 * Recursively extract static `_type`s from GROQ filter expressions. If the
 * types can't be statically determined then it will return `null`.
 */
// eslint-disable-next-line complexity
function findTypes(node: ExprNode): Set<string> | null {
  switch (node.type) {
    case 'OpCall': {
      const {left, right} = node

      switch (node.op) {
        // e.g. `a == b`
        case '==': {
          // e.g. `_type == 'value'`
          if (left.type === 'AccessAttribute' && left.name === '_type' && !left.base) {
            if (right.type !== 'Value' || typeof right.value !== 'string') return null
            return new Set([right.value])
          }

          // e.g. `'value' == _type`
          if (right.type === 'AccessAttribute' && right.name === '_type' && !right.base) {
            if (left.type !== 'Value' || typeof left.value !== 'string') return null
            return new Set([left.value])
          }

          // otherwise, we can't determine the types statically
          return null
        }

        // e.g. `a in b`
        case 'in': {
          // if `_type` is not on the left hand side of `in` then it can't be determined
          if (left.type !== 'AccessAttribute' || left.name !== '_type' || left.base) return null
          // if the right hand side is not an array then the types can't be determined
          if (right.type !== 'Array') return null

          const types = new Set<string>()
          // iterate through all the types
          for (const element of right.elements) {
            // if we find a splat, then early return, we can't determine the types
            if (element.isSplat) return null
            // if the array element is not just a simple value, then early return
            if (element.value.type !== 'Value') return null
            // if the array element value is not a string, then early return
            if (typeof element.value.value !== 'string') return null
            // otherwise add the element value to the set of types
            types.add(element.value.value)
          }

          // if there were any elements in the types set, return it
          if (types.size) return types
          // otherwise, the set of types cannot be determined
          return null
        }

        default: {
          return null
        }
      }
    }

    // groups can just be unwrapped, the AST preserves the order
    case 'Group': {
      return findTypes(node.base)
    }

    // e.g. `_type == 'a' || _type == 'b'`
    // with Or nodes, if we can't determine the types for either the left or
    // right hand side then we can't determine the types for any
    // e.g. `_type == 'a' || isActive`
    // — can't determine types because `isActive` could be true on another types
    case 'Or': {
      const left = findTypes(node.left)
      if (!left) return null

      const right = findTypes(node.right)
      if (!right) return null

      return new Set([...left, ...right])
    }

    // e.g. `_type == 'a' && isActive`
    // with And nodes, we can determine the types as long as we can determine
    // the types for one side. We can't determine the types if both are `null`.
    case 'And': {
      const left = findTypes(node.left)
      const right = findTypes(node.right)

      if (!left && !right) return null
      return new Set([...(left || []), ...(right || [])])
    }

    default: {
      return null
    }
  }
}

export function findStaticTypesInFilter(
  filter: string,
  params: Record<string, unknown> = {},
): string[] | null {
  try {
    const types = findTypes(parse(filter, {params}))
    if (!types) return null

    return Array.from(types).sort()
  } catch {
    // if we couldn't parse the filter, just return `null`
    return null
  }
}
