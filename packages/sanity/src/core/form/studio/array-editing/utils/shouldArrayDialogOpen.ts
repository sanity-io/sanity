import {toString} from '@sanity/util/paths'
import {
  isArrayOfBlocksSchemaType,
  isArrayOfObjectsSchemaType,
  type ObjectSchemaType,
  type Path,
} from 'sanity'

// import {isPortableTextSchemaType} from './asserters'
import {getRootPath} from './getRootPath'
import {getSchemaField} from './getSchemaField'

/**
 * A utility function to check if the global array editing dialog should be open.
 * @param schemaType - The schema object that we are opening
 * @param path - The path that we are focusing on
 * @returns Returns true if the dialog should be open
 * @internal
 */
export function shouldArrayDialogOpen(schemaType: ObjectSchemaType, path: Path): boolean {
  // If the path is empty, we can't determine if the array dialog is open
  if (path.length === 0) return false

  const rootPath = getRootPath(path)

  // Get the field for the first segments
  const field = getSchemaField(schemaType, toString(rootPath))

  // Check if the field is an array of objects
  if (isArrayOfObjectsSchemaType(field?.type)) {
    // Check if the array of objects is an array of references.
    const isArrayOfReferences = field.type.of.every((type) => type?.hasOwnProperty('to'))
    const isPortableText = isArrayOfBlocksSchemaType(field.type)

    // Return false if the array of objects is an array of references
    // since these are edited inline and not in a dialog.
    if (isArrayOfReferences) return false

    // Return false if the array of objects is an array of portable text
    // since these are edited inline and not in a dialog.
    if (isPortableText) return false

    // Else, return true if it is an array of objects
    return true
  }

  // Otherwise, return false
  return false
}
