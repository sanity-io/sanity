/**
 * Modified version of fast-deep-equal (https://github.com/epoberezkin/fast-deep-equal)
 * MIT-licensed, copyright (c) 2017 Evgeny Poberezkin
 **/

// NOTE: when converting to typescript, some of the checks were inlined (vs
// having them in a variable) because the type predicate type narrowing only
// works when type predicate is called inline in the condition that starts the
// control flow branch.
// see here: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
export function deepEquals(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length != b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!deepEquals(a[i], b[i])) {
        return false
      }
    }
    return true
  }

  if (Array.isArray(a) != Array.isArray(b)) {
    return false
  }

  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const keys = Object.keys(a)
    if (keys.length !== Object.keys(b).length) {
      return false
    }

    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime()
    }

    if (a instanceof Date != b instanceof Date) {
      return false
    }

    if (a instanceof RegExp && b instanceof RegExp) {
      return a.toString() == b.toString()
    }

    if (a instanceof RegExp != b instanceof RegExp) {
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

      if (!deepEquals(a[key], b[key])) {
        return false
      }
    }

    return true
  }

  return false
}
