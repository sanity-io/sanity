export function arrayify<T>(val: Array<T> | T): Array<T> {
  if (Array.isArray(val)) {
    return val
  }

  return val ? [val] : []
}
