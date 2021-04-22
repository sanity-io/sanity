import {ArraySchemaType, SchemaType} from '@sanity/types'
import {resolveTypeName} from '@sanity/util/content'
import {IGNORE_KEYS} from './constants'

// eslint-disable-next-line @typescript-eslint/ban-types
export function isEmpty(value: Record<string, unknown>): value is Record<never, never> {
  return Object.keys(value).every((key) => IGNORE_KEYS.includes(key))
}

export function getItemType(arrayType: ArraySchemaType, item: any): SchemaType | undefined {
  const itemTypeName = resolveTypeName(item)

  return itemTypeName === 'object' && arrayType.of.length === 1
    ? arrayType.of[0]
    : arrayType.of.find((memberType) => memberType.name === itemTypeName)
}
