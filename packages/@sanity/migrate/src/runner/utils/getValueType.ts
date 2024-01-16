export function getValueType(value: unknown) {
  if (Array.isArray(value)) {
    return 'array'
  }
  return value === null ? 'null' : typeof value
}
