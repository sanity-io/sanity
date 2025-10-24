import {
  isArrayOfBlocksSchemaType,
  isArrayOfObjectsSchemaType,
  isObjectSchemaType,
  type ObjectField,
  type Path,
  type SchemaType,
} from '@sanity/types'
import {get, startsWith} from '@sanity/util/paths'

import {stringToPath} from '../../../../field/paths/helpers'
import {pathToString} from '../../../../validation/util/pathToString'

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
 * @param documentValue - Optional document value to check if path points to an inline object
 * @returns true if the path points to text content (children) within a portable text field
 *
 * Example:
 * ```js
 * const isTextContent = isPathWithinPortableText(schemaType.fields, ['content', {_key: 'abc'}, 'children', {_key: 'def'}])
 * // Returns true if 'content' is a portable text field AND the path contains 'children'
 * ```
 */
export function isPathTextInPTEField(
  fields: ObjectField<SchemaType>[],
  targetPath: Path,
  documentValue?: unknown,
): boolean {
  if (targetPath.length === 0) return false

  const allPTEPaths = findPTEtypePaths(fields)

  const possiblePaths: string[] = []
  const currentSegments: string[] = []
  for (const segment of targetPath) {
    if (typeof segment === 'string') {
      currentSegments.push(segment)
      possiblePaths.push(currentSegments.join('.'))
    }
  }

  const isWithinPTEField = allPTEPaths.some((parentPath) => {
    return possiblePaths.some(
      (path) => path === pathToString(parentPath) || startsWith(parentPath, stringToPath(path)),
    )
  })

  // The 'children' field is where the actual text spans live in portable text blocks
  // Which is the main reason we are here - to check if the path points to text content
  const containsChildren = targetPath.some(
    (segment) => typeof segment === 'string' && segment === 'children',
  )
  if (!isWithinPTEField || !containsChildren) return false

  // If we don't have the document value, default to "text content"
  if (!documentValue) return true

  const valueAtPath = get(documentValue, targetPath)
  // If the value at the path is an object with _type !== 'span', it is not text content
  if (
    valueAtPath &&
    typeof valueAtPath === 'object' &&
    '_type' in valueAtPath &&
    valueAtPath._type !== 'span'
  ) {
    return false
  }

  return true
}

/**
 * Find the schema path for the Portable Text field that the target path belongs to, if any.
 * Returns the path to the PTE array field within the document schema (without key segments).
 */
export function findPTEParentPathForTarget(
  fields: ObjectField<SchemaType>[],
  targetPath: Path,
): Path | null {
  if (targetPath.length === 0) return null

  const allPTEPaths = findPTEtypePaths(fields)

  const possiblePaths: string[] = []
  const currentSegments: string[] = []
  for (const segment of targetPath) {
    if (typeof segment === 'string') {
      currentSegments.push(segment)
      possiblePaths.push(currentSegments.join('.'))
    }
  }

  // Find all PTE parent paths that match or are ancestors of the target path
  const matches = allPTEPaths.filter((parentPath) => {
    return possiblePaths.some(
      (path) => path === pathToString(parentPath) || startsWith(parentPath, stringToPath(path)),
    )
  })

  if (matches.length === 0) return null

  // Return the most specific (longest) matching parent path
  return matches.reduce<Path | null>((prev, curr) => {
    if (!prev) return curr
    return curr.length > prev.length ? curr : prev
  }, null)
}
