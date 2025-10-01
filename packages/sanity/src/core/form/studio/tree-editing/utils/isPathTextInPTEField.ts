import {
  isArrayOfBlocksSchemaType,
  isArrayOfObjectsSchemaType,
  isObjectSchemaType,
  type ObjectField,
  type Path,
  type SchemaType,
} from '@sanity/types'
import {toString} from '@sanity/util/paths'

/**
 * Find the paths to Portable Text Editor (array of type block) schema types in a list of fields
 *
 * Example:
 * ```js
 * const paths = findPTEtypePaths(objectSchemaType.fields)
 *
 * // => [['field1', 'field2', 'arrayField'], ['field1', 'field2', 'arrayField2']]
 * ```
 */
export function findPTEtypePaths(
  fields: ObjectField<SchemaType>[],
  basePath: Path = [],
  visitedTypes: Set<string> = new Set(),
): Path[] {
  // Array to store paths to array schema types
  const arrayPaths: Path[] = []

  fields.forEach((field) => {
    // Create a new path by extending the base path with the current field's name
    const newPath = [...basePath, field.name]

    // If the field type is a portable text array, add the new path to the arrayPaths array
    if (isArrayOfBlocksSchemaType(field.type)) {
      arrayPaths.push(newPath)
    }

    // If the field type is an object, recursively check its fields
    if (isObjectSchemaType(field.type)) {
      const typeName = field.type.name

      // Prevent infinite recursion by checking if we've already visited this type
      if (!visitedTypes.has(typeName)) {
        const newVisitedTypes = new Set(visitedTypes)
        newVisitedTypes.add(typeName)

        // Recursively check the fields of the nested object with the correct path context
        const nestedPaths = findPTEtypePaths(field.type.fields, newPath, newVisitedTypes)
        arrayPaths.push(...nestedPaths)
      }
    }

    // If the field type is an array of objects, check inside the object schema for portable text fields
    if (isArrayOfObjectsSchemaType(field.type)) {
      // For arrays of objects, we need to look at the object schema inside the array
      // The array's 'of' property contains the possible object types
      field.type.of?.forEach((arrayMemberType) => {
        if (isObjectSchemaType(arrayMemberType)) {
          const typeName = arrayMemberType.name

          // Prevent infinite recursion by checking if we've already visited this type
          if (!visitedTypes.has(typeName)) {
            const newVisitedTypes = new Set(visitedTypes)
            newVisitedTypes.add(typeName)

            // Recursively check the fields of objects within the array
            const nestedPaths = findPTEtypePaths(arrayMemberType.fields, newPath, newVisitedTypes)
            arrayPaths.push(...nestedPaths)
          }
        }
      })
    }
  })

  // Return the array of paths to array schema types
  return arrayPaths
}

/**
 * Check if a given path points to actual text content within a portable text field
 *
 * @param fields - The schema fields to search through
 * @param targetPath - The path to check (can be a Path array or string)
 * @returns true if the path points to text content (children) within a portable text field
 *
 * Example:
 * ```js
 * const isTextContent = isPathWithinPortableText(schemaType.fields, ['content', {_key: 'abc'}, 'children', {_key: 'def'}])
 * // Returns true if 'content' is a portable text field AND the path contains 'children'
 * ```
 */
export function isPathTextInPTEField(fields: ObjectField<SchemaType>[], targetPath: Path): boolean {
  if (targetPath.length === 0) return false

  // Get all portable text paths in the schema
  const allPTEPaths = findPTEtypePaths(fields)

  // Convert target path to segments, collecting all possible field paths
  // We need to check multiple levels because portable text can be nested deep
  const possiblePaths: string[] = []
  const currentSegments: string[] = []

  for (const segment of targetPath) {
    if (typeof segment === 'string') {
      currentSegments.push(segment)
      // Add this path as a possible match
      possiblePaths.push(currentSegments.join('.'))
    }
    // Continue processing even after array keys - don't break
  }

  // Check if any portable text path matches any of our possible paths
  // AND if the target path contains 'children' (which indicates actual text content)
  const isWithinPTEField = allPTEPaths.some((ptePath) => {
    const ptePathString = toString(ptePath)
    return possiblePaths.some((possiblePath) => {
      // Exact match: the path leads directly to a PTE field
      if (possiblePath === ptePathString) {
        return true
      }
      // Check if the target path is within a PTE field (possible path starts with PTE path)
      // This handles cases where we're inside an array that contains PTE fields
      // This is particularly important for nested arrays of objects or text
      return possiblePath.startsWith(`${ptePathString}.`)
    })
  })

  // Only return true if we're within a PTE field AND the path contains 'children'
  // The 'children' field is where the actual text spans live in portable text blocks
  // Which is the main reason we are here - to check if the path points to text content
  const containsChildren = targetPath.some(
    (segment) => typeof segment === 'string' && segment === 'children',
  )

  const result = isWithinPTEField && containsChildren

  return result
}
