import {
  isArrayOfBlocksSchemaType,
  isKeySegment,
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
export function findPTEtypePaths(fields: ObjectField<SchemaType>[]): Path[] {
  // Array to store paths to array schema types
  const arrayPaths: Path[] = []

  // Initialize an empty path to keep track of the current path in the schema tree
  let currentPath: Path = []

  fields.forEach((field) => {
    // Create a new path by extending the current path with the current field's name
    const newPath = [...currentPath, field.name]

    // If the field type is an array, add the new path to the arrayPaths array
    if (isArrayOfBlocksSchemaType(field.type)) {
      arrayPaths.push(newPath)
    }

    // If the field type is an object, recursively check its fields
    if (isObjectSchemaType(field.type)) {
      // Update the current path for the nested object
      currentPath = newPath

      // Recursively check the fields of the nested object
      findPTEtypePaths(field.type.fields)

      // Reset the path after recursion to backtrack
      currentPath = currentPath.slice(0, -1)
    }
  })

  // Return the array of paths to array schema types
  return arrayPaths
}

/**
 * Check if a given path contains or leads to a portable text field by traversing the schema
 *
 * @param fields - The schema fields to search through
 * @param targetPath - The path to check (can be a Path array or string)
 * @returns true if the path contains or leads to a portable text field
 *
 * Example:
 * ```js
 * const hasPortableText = isPathWithinPortableText(schemaType.fields, ['content', {_key: 'abc'}, 'children'])
 * // Returns true if 'content' is a portable text field
 * ```
 */
export function isPathWithinPortableText(
  fields: ObjectField<SchemaType>[],
  targetPath: Path,
): boolean {
  if (targetPath.length === 0) return false

  // Get all portable text paths in the schema
  const ptePaths = findPTEtypePaths(fields)

  // Convert target path to string for comparison, excluding array keys/indices
  const targetPathSegments: string[] = []
  for (const segment of targetPath) {
    if (typeof segment === 'string') {
      targetPathSegments.push(segment)
    } else if (isKeySegment(segment)) {
      // Stop at array items - we want to check if the parent array is portable text
      break
    }
  }

  const targetPathString = targetPathSegments.join('.')

  // Check if any portable text path is a prefix of or matches the target path
  return ptePaths.some((ptePath) => {
    const ptePathString = toString(ptePath)
    return targetPathString.startsWith(ptePathString) || ptePathString.startsWith(targetPathString)
  })
}
