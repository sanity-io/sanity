import {IGNORE_KEYS} from './constants'

export function isEmpty(value) {
  return Object.keys(value).every((key) => IGNORE_KEYS.includes(key))
}
