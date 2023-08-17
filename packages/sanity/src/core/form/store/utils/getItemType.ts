import {ArraySchemaType, SchemaType} from '@sanity/types'
import {resolveTypeName} from '@sanity/util/content'

export function getItemType(arrayType: ArraySchemaType, item: unknown): SchemaType | undefined {
  const itemTypeName = resolveTypeName(item)

  return itemTypeName === 'object' && arrayType.of.length === 1
    ? arrayType.of[0]
    : arrayType.of.find((memberType) => memberType.name === itemTypeName)
}

export function getPrimitiveItemType(
  arrayType: ArraySchemaType,
  item: unknown,
): SchemaType | undefined {
  const itemTypeName = resolveTypeName(item)

  return arrayType?.of.find(
    (memberType) => memberType.name === itemTypeName || memberType.jsonType === itemTypeName,
  )
}
