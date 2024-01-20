import {isObjectSchemaType, type SchemaType} from '@sanity/types'
import {randomKey} from '@sanity/util/content'

import {type ObjectItem} from '../../../types'
import {createProtoValue} from '../../../utils/createProtoValue'

export function createProtoArrayValue<Item extends ObjectItem>(type: SchemaType): Item {
  if (!isObjectSchemaType(type)) {
    throw new Error(
      `Invalid item type: "${type.type}". Default array input can only contain objects (for now)`,
    )
  }

  return {...createProtoValue(type), _key: randomKey(12)} as Item
}
