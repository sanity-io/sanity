import {toString} from '@sanity/util/paths'
import {type ObjectSchemaType, type Path} from 'sanity'

import {getSchemaField} from './getSchemaField'

export function isOpen(schemaType: ObjectSchemaType, focusPath: Path): boolean {
  const startSegment = focusPath[0]
  if (!startSegment) return false

  return getSchemaField(schemaType, toString([startSegment]))?.type.jsonType === 'array'
}
