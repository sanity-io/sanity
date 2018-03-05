// @flow
export default function hasEqualFields(fields: string[]) {
  return (object: ?Object, otherObject: ?Object) => {
    if (object === otherObject) {
      return true
    }
    if (!object || !otherObject) {
      return false
    }
    if (typeof object !== 'object' || typeof otherObject !== 'object') {
      return false
    }
    return fields.every(field => object[field] === otherObject[field])
  }
}
