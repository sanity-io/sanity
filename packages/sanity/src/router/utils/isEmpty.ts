import {hasOwn} from './hasOwn'

export function isEmpty(object: Record<string, unknown>): boolean {
  for (const key in object) {
    if (hasOwn(object, key)) {
      return false
    }
  }

  return true
}
