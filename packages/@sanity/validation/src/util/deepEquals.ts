/**
 * Modified version of fast-deep-equal (https://github.com/epoberezkin/fast-deep-equal)
 * MIT-licensed, copyright (c) 2017 Evgeny Poberezkin
 **/

/* eslint max-depth: ["error", 4] */
export default function equal(a, b) {
  if (a === b) {
    return true
  }

  const arrA = Array.isArray(a)
  const arrB = Array.isArray(b)

  if (arrA && arrB) {
    if (a.length != b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!equal(a[i], b[i])) {
        return false
      }
    }
    return true
  }

  if (arrA != arrB) {
    return false
  }

  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const keys = Object.keys(a)
    if (keys.length !== Object.keys(b).length) {
      return false
    }

    const dateA = a instanceof Date
    const dateB = b instanceof Date
    if (dateA && dateB) {
      return a.getTime() === b.getTime()
    }

    if (dateA != dateB) {
      return false
    }

    const regexpA = a instanceof RegExp
    const regexpB = b instanceof RegExp
    if (regexpA && regexpB) {
      return a.toString() == b.toString()
    }

    if (regexpA != regexpB) {
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
      if (keys[i] === '_key') {
        continue
      }

      if (!equal(a[keys[i]], b[keys[i]])) {
        return false
      }
    }

    return true
  }

  return false
}
