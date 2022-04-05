import {ArraySchemaType, SchemaType} from '@sanity/types'
import {resolveTypeName} from '@sanity/util/content'

export function getItemType(arrayType: ArraySchemaType, item: any): SchemaType | undefined {
  const itemTypeName = resolveTypeName(item)

  return itemTypeName === 'object' && arrayType.of.length === 1
    ? arrayType.of[0]
    : arrayType.of.find((memberType) => memberType.name === itemTypeName)
}
