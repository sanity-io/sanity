import hasOwn from './hasOwn'

export function isShallowEmptyObject(value: {[key: string]: unknown}): boolean {
  for (const key in value) {
    if (key === '_type' || key === '_key') {
      continue
    }
    if (hasOwn(value, key) && value[key] !== undefined) {
      return false
    }
  }
  return true
}
