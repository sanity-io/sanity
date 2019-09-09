import hasOwn from './hasOwn'

export default function isEmpty(object: Object): boolean {
  for (const key in object) {
    if (hasOwn(object, key)) {
      return false
    }
  }
  return true
}
