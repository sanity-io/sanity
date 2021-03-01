import {isKeyedObject} from '@sanity/types'

export function isEqual(item: unknown, otherItem: unknown): boolean {
  if (item === otherItem) {
    return true
  }

  if (typeof item !== typeof otherItem) {
    return false
  }

  if (typeof item !== 'object' && !Array.isArray(item)) {
    return item === otherItem
  }

  if (isKeyedObject(item) && isKeyedObject(otherItem) && item._key === otherItem._key) {
    return true
  }

  if (Array.isArray(item) && Array.isArray(otherItem)) {
    if (item.length !== otherItem.length) {
      return false
    }

    return item.every((child, i) => isEqual(child, otherItem[i]))
  }

  if (item === null || otherItem === null) {
    return item === otherItem
  }

  const obj = item as Record<string, unknown>
  const otherObj = otherItem as Record<string, unknown>

  const keys = Object.keys(obj)
  const otherKeys = Object.keys(otherObj)
  if (keys.length !== otherKeys.length) {
    return false
  }

  return keys.every((keyName) => isEqual(item[keyName], otherObj[keyName]))
}
