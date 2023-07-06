import hasOwn from './hasOwn'

function isDeepEmptyObject(value: {[key: string]: any}): boolean {
  for (const key in value) {
    if (key === '_type' || key === '_key') {
      continue
    }
    if (hasOwn(value, key) && !isDeepEmpty(value[key])) {
      return false
    }
  }
  return true
}

function isDeepEmptyArray(value: unknown[]): boolean {
  for (let i = 0; i < value.length; i++) {
    if (!isDeepEmpty(value[i])) {
      return false
    }
  }
  return true
}

/**
 * Looks at the value and determines if it is deeply empty while not considering _type and _key attributes on objects.
 * A value will be considered deeply empty if it is:
 *  - undefined or null
 *  - an object where all property values are deeply empty
 *  - an array where all items are deeply empty
 * @param value - the value to check for deep emptiness
 */
export function isDeepEmpty(value: unknown): boolean {
  if (value === undefined || value === null) {
    return true
  }
  const type = typeof value

  if (Array.isArray(value)) {
    return isDeepEmptyArray(value)
  }
  if (type === 'object') {
    return isDeepEmptyObject(value)
  }
  return false
}

/**
 * @deprecated Use `isDeepEmpty` instead
 * todo: remove in v4
 */
export const isEmptyArray = isDeepEmptyArray

/**
 * @deprecated Use `isDeepEmpty` instead
 * todo: remove in v4
 */
export const isEmpty = isDeepEmpty

/**
 * @deprecated Use `isDeepEmpty` instead
 * todo: remove in v4
 */
export const isEmptyObject = isDeepEmptyObject
