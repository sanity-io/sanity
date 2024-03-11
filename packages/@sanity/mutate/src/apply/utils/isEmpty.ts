import {hasOwn} from './hasOwn'

export function isEmpty(v: object) {
  for (const key in v) {
    if (hasOwn(v, key)) {
      return false
    }
  }
  return true
}
