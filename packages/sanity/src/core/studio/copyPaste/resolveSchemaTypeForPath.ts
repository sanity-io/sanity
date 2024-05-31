import {
  isIndexSegment,
  isKeySegment,
  isReferenceSchemaType,
  type Path,
  type SchemaType,
} from '@sanity/types'

function getFieldTypeByName(type: SchemaType, fieldName: string): SchemaType | undefined {
  if (!('fields' in type)) {
    return undefined
  }

  const fieldType = type.fields.find((field) => field.name === fieldName)
  return fieldType ? fieldType.type : undefined
}

export function resolveSchemaTypeForPath(baseType: SchemaType, path: Path): SchemaType | undefined {
  const pathSegments = path

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
