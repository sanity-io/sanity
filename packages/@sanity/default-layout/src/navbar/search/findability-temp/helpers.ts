import {SchemaType} from '@sanity/types'

export const IS_MAC =
  typeof window != 'undefined' && /Mac|iPod|iPhone|iPad/.test(window.navigator.platform)

export function getRootType(type: SchemaType): SchemaType {
  if (!type.type) {
    return type
  }
  return getRootType(type.type)
}
