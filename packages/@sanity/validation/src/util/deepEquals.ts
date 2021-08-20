/**
 * Modified version of fast-deep-equal (https://github.com/epoberezkin/fast-deep-equal)
 * MIT-licensed, copyright (c) 2017 Evgeny Poberezkin
 **/

export default function equal(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true
  }

  const aIsArr = Array.isArray(a)
  const bIsArr = Array.isArray(b)

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length != b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!equal(a[i], b[i])) {
        return false
      }
    }
    return true
  }

  if (aIsArr != bIsArr) {
    return false
  }

  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const keys = Object.keys(a)
    if (keys.length !== Object.keys(b).length) {
      return false
    }

    const aIsDate = a instanceof Date
    const bIsDate = b instanceof Date
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime()
    }

    if (aIsDate != bIsDate) {
      return false
    }

    const aIsRegexp = a instanceof RegExp
    const bIsRegexp = b instanceof RegExp
    if (a instanceof RegExp && b instanceof RegExp) {
      return a.toString() == b.toString()
    }

    if (aIsRegexp != bIsRegexp) {
      return false
    }

    for (let i = 0; i < keys.length; i++) {
      if (keys[i] === '_key') {
        continue
      }

      if (!Object.prototype.hasOwnProperty.call(b, keys[i])) {
        return false
      }
    }

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i] as keyof typeof a
      if (key === '_key') {
        continue
      }

      if (!equal(a[key], b[key])) {
        return false
      }
    }

    return true
  }

  return false
}
