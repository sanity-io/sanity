import {toString} from '@sanity/util/paths'
import {isObjectSchemaType, type ObjectSchemaType, type Path} from 'sanity'

import {getSchemaField} from './getSchemaField'

export function isOpen(schemaType: ObjectSchemaType, focusPath: Path): boolean {
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
