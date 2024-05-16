import {toString} from '@sanity/util/paths'
import {isArrayOfObjectsSchemaType, type ObjectSchemaType, type Path} from 'sanity'

import {getSchemaField} from './getSchemaField'

/**
 * A utility function to check if the global array editing dialog should be open.
 * @param schemaType - The schema object that we are opening
 * @param focusPath - The path that we are focusing on
 * @returns Returns true if the dialog shoulb be open
 * @internal
 */
export function shouldArrayDialogOpen(schemaType: ObjectSchemaType, focusPath: Path): boolean {
  // If the focusPath is empty, we can't determine if the array dialog is open
  if (focusPath.length === 0) return false

  // Get the first segment of the focusPath
  const [startSegment] = focusPath

  // Get the field for the first segment of the focusPath
  const field = getSchemaField(schemaType, toString([startSegment]))

  // Check if the field is an array of objects
  if (isArrayOfObjectsSchemaType(field?.type)) {
    // Check if the array of objects is an array of references.
    const isArrayOfReferences = field.type.of.some((type) => type?.hasOwnProperty('to'))

    // Return false if the array of objects is an array of references
    // since these are edited inline and not in a dialog.
    if (isArrayOfReferences) return false

    // Else, return true if it is an array of objects
    return true
  }

  // Otherwise, return false
  return false
}
