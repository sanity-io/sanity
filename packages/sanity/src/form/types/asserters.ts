import {isObjectSchemaType} from '@sanity/types'
import {ItemProps, ObjectItemProps} from './itemProps'

export function isObjectItemProps(item: ItemProps): item is ObjectItemProps {
  return isObjectSchemaType(item.schemaType)
}
