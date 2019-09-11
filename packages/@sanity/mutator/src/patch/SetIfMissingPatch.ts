export default class SetIfMissingPatch {
  id: string
  path: string
  value: any
  constructor(id: string, path: string, value: any) {
    this.id = id
    this.path = path
    this.value = value
  }
  apply(targets, accessor) {
    let result = accessor
    targets.forEach(target => {
      if (target.isIndexReference()) {
        // setIfMissing do not apply to arrays, since Gradient will reject nulls in arrays
      } else if (target.isAttributeReference()) {
        if (!result.hasAttribute(target.name())) {
          result = accessor.setAttribute(target.name(), this.value)
        }
      } else {
        throw new Error(`Unable to apply to target ${target.toString()}`)
      }
    })
    return result
  }
}
