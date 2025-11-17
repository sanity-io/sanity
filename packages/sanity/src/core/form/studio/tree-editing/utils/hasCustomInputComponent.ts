import {
  isArrayOfBlocksSchemaType,
  isArrayOfObjectsSchemaType,
  isKeySegment,
  isObjectSchemaType,
  type ObjectField,
  type Path,
  type SchemaType,
} from '@sanity/types'

/**
 * Helper function to check if a schema type has components.input
 */
function hasComponentsInput(schemaType: SchemaType): boolean {
  return Boolean(schemaType.components?.input)
}

/**
 * Check if the final field at the target path has a custom input component
 * defined via `components?.input`.
 *
 * Note: Portable Text Editor fields (array of blocks) are excluded even if they
 * have components.input, as they are handled separately by the PTE logic.
 *
 * @param fields - The schema fields to search through
 * @param targetPath - The path to check (can be a Path array or string)
 * @returns true if the final field at the path has components.input defined (excluding PTE fields)
 *
 * Example:
 * ```js
 * const hasCustomInput = hasCustomInputComponent(schemaType.fields, ['content', 'title'])
 * // Returns true only if 'title' field has components.input defined and is not a PTE field
 * ```
 */
export function hasCustomInputComponent(
  fields: ObjectField<SchemaType>[],
  targetPath: Path,
): boolean {
  if (targetPath.length === 0) return false

  // Helper function to recursively find field by path and check for components.input
  const checkPathForComponents = (
    currentFields: ObjectField<SchemaType>[],
    pathSegments: Path,
    visitedTypes: Set<string> = new Set(),
  ): boolean => {
    if (pathSegments.length === 0) return false

    const [currentSegment, ...remainingPath] = pathSegments

    // Skip key segments (objects with _key property)
    if (isKeySegment(currentSegment)) {
      return checkPathForComponents(currentFields, remainingPath, visitedTypes)
    }

    // Find the field matching the current segment (which will not be a key segment)
    const field = currentFields.find((f) => f.name === currentSegment)
    if (!field) return false

    // Check if this is the last STRING segment in the path (there might be key segments after)
    // If there are more string segments, we need to continue traversing the path
    // If there are no more string segments, we have reached the final field and therefore need to check if it has components.input
    const hasMoreStringSegments = remainingPath.some((seg) => typeof seg === 'string')

    if (!hasMoreStringSegments) {
      // This is the final field name, check if it has components.input
      // BUT skip Portable Text Editor fields (array of blocks) - they're handled separately
      if (isArrayOfBlocksSchemaType(field.type)) {
        return false
      }
      return hasComponentsInput(field.type)
    }

    const checkVisitedTypes = (type: SchemaType) => {
      if (isObjectSchemaType(type)) {
        const typeName = type.name
        if (!visitedTypes.has(typeName)) {
          const newVisitedTypes = new Set(visitedTypes)
          newVisitedTypes.add(typeName)
          return checkPathForComponents(type.fields, remainingPath, newVisitedTypes)
        }
      }
      return false
    }

    // Continue traversing the path
    if (isObjectSchemaType(field.type)) {
      return checkVisitedTypes(field.type)
    }

    // If the field is an array of objects, check inside the array members
    if (isArrayOfObjectsSchemaType(field.type)) {
      return field.type.of?.some((memberType) => checkVisitedTypes(memberType)) ?? false
    }

    return false
  }

  return checkPathForComponents(fields, targetPath)
}
