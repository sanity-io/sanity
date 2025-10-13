import {type ArraySchemaType, isKeySegment, type ObjectSchemaType, type Path} from '@sanity/types'

/**
 * Checks if any item type in an array has readOnly set to true
 */
function hasReadOnlyArrayItems(arrayType: ArraySchemaType): boolean {
  if (!Array.isArray(arrayType.of)) return false

  return arrayType.of.some(
    (itemType) =>
      typeof itemType === 'object' && 'readOnly' in itemType && itemType.readOnly === true,
  )
}

/**
 * Finds the first object schema type in an array's item types
 */
function getArrayObjectType(arrayType: ArraySchemaType): ObjectSchemaType | undefined {
  if (!Array.isArray(arrayType.of)) return undefined

  const objectType = arrayType.of.find((itemType) => itemType.jsonType === 'object')
  return objectType as ObjectSchemaType | undefined
}

/**
 * Gets the readOnly value for a specific path by looking it up in the schema.
 * Traverses through arrays and their item types to find readOnly at any level.
 */
export function getReadOnlyForPath(schemaType: ObjectSchemaType, path: Path): boolean {
  let currentSchemaType: ObjectSchemaType | undefined = schemaType

  for (const segment of path) {
    // Skip key segments - they don't represent schema fields
    if (isKeySegment(segment)) continue

    // Must be an object type to have fields
    if (!currentSchemaType || currentSchemaType.jsonType !== 'object') return false

    // Find the field in the current schema
    const field = currentSchemaType.fields?.find((childField) => childField.name === segment)
    if (!field) return false

    // Check if this field has readOnly
    if (field.type?.readOnly) return true

    // Handle array fields
    if (field.type?.jsonType === 'array') {
      const arrayType = field.type as ArraySchemaType

      // Check if array items have readOnly
      if (hasReadOnlyArrayItems(arrayType)) return true

      // Continue with the array object type, nesting down
      currentSchemaType = getArrayObjectType(arrayType)
    } else if (field.type?.jsonType === 'object') {
      // Continue with the array object type, nesting down
      currentSchemaType = field.type as ObjectSchemaType
    }
  }

  return false
}
