import {toString} from '@sanity/util/paths'
import {isObjectSchemaType, type ObjectSchemaType, type Path} from 'sanity'

import {getSchemaField} from './getSchemaField'

/**
 * A utility function to check if the global array editing dialog is open.
 * @param schemaType - The schema object that we are opening
 * @param focusPath - The path that we are focusing on
 * @returns Returns true if the dialog is open

 * @internal
 */
export function isArrayDialogOpen(schemaType: ObjectSchemaType, focusPath: Path): boolean {
  const [startSegment, secondSegment] = focusPath
  /* 
  If the first path is empty or
  if the second segment does not have a key then it means that we are clicking on the array input and not on an item pr
  if the schemaType is not an object schema type then the dialog should not open
  */
  if (!startSegment || !secondSegment?.hasOwnProperty('_key') || !isObjectSchemaType(schemaType))
    return false

  return getSchemaField(schemaType, toString([startSegment]))?.type.jsonType === 'array'
}
