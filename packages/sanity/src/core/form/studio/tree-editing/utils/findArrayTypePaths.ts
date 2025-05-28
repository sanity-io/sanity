import {
  isArrayOfBlocksSchemaType,
  isArrayOfObjectsSchemaType,
  isObjectSchemaType,
  type ObjectField,
  type Path,
  type SchemaType,
} from '@sanity/types'

/**
 * Find the paths to array schema types in a list of fields
 *
 * Example:
 * ```js
 * const paths = findArrayTypePaths(objectSchemaType.fields)
 *
 * // => [['field1', 'field2', 'arrayField'], ['field1', 'field2', 'arrayField2']]
 * ```
 */
export function findArrayTypePaths(fields: ObjectField<SchemaType>[]): Path[] {
  // Array to store paths to array schema types
  const arrayPaths: Path[] = []

  // Initialize an empty path to keep track of the current path in the schema tree
  let currentPath: Path = []

  // Recursive function to check fields for array schema types
  function checkFields(nestedFields: ObjectField<SchemaType>[]) {
    nestedFields.forEach((field) => {
      // Create a new path by extending the current path with the current field's name
      const newPath = [...currentPath, field.name]

      // If the field type is an array, add the new path to the arrayPaths array
      if (isArrayOfObjectsSchemaType(field.type) && !isArrayOfBlocksSchemaType(field.type)) {
        arrayPaths.push(newPath)
      }

      // If the field type is an object, recursively check its fields
      if (isObjectSchemaType(field.type)) {
        // Update the current path for the nested object
        currentPath = newPath

        // Recursively check the fields of the nested object
        checkFields(field.type.fields)

        // Reset the path after recursion to backtrack
        currentPath = currentPath.slice(0, -1)
      }
    })
  }

  // Start checking from the top-level fields
  checkFields(fields)

  // Return the array of paths to array schema types
  return arrayPaths
}
