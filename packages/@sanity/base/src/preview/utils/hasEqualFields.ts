export function hasEqualFields(fields: string[]) {
  return (object: Record<string, any> | null, otherObject: Record<string, any> | null) => {
    if (object === otherObject) {
      return true
    }
    if (!object || !otherObject) {
      return false
    }
    if (typeof object !== 'object' || typeof otherObject !== 'object') {
      return false
    }
    return fields.every((field) => object[field] === otherObject[field])
  }
}
