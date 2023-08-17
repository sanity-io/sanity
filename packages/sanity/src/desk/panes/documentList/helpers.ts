import * as PathUtils from '@sanity/util/paths'
import {
  isIndexSegment,
  isKeySegment,
  isReferenceSchemaType,
  ObjectField,
  ObjectFieldType,
  ObjectSchemaType,
  SanityDocument,
  SchemaType,
} from '@sanity/types'
import {DocumentListPaneItem, SortOrder} from './types'
import {getPublishedId, collate} from 'sanity'

export function getDocumentKey(value: DocumentListPaneItem, index: number): string {
  return value._id ? getPublishedId(value._id) : `item-${index}`
}

export function removePublishedWithDrafts(documents: SanityDocument[]): DocumentListPaneItem[] {
  return collate(documents).map((entry) => {
    const doc = entry.draft || entry.published
    return {
      ...doc,
      hasPublished: !!entry.published,
      hasDraft: !!entry.draft,
    }
  }) as any
}

const RE_TYPE_NAME_IN_FILTER =
  /\b_type\s*==\s*(['"].*?['"]|\$.*?(?:\s|$))|\B(['"].*?['"]|\$.*?(?:\s|$))\s*==\s*_type\b/
export function getTypeNameFromSingleTypeFilter(
  filter: string,
  params: Record<string, unknown> = {},
): string | null {
  const matches = filter.match(RE_TYPE_NAME_IN_FILTER)

  if (!matches) {
    return null
  }

  const match = (matches[1] || matches[2]).trim().replace(/^["']|["']$/g, '')

  if (match[0] === '$') {
    const k = match.slice(1)
    const v = params[k]

    return typeof v === 'string' ? v : null
  }

  return match
}

export function isSimpleTypeFilter(filter: string): boolean {
  return /^_type\s*==\s*['"$]\w+['"]?\s*$/.test(filter.trim())
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
