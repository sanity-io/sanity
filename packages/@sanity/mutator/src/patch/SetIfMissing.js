export default class SetIfMissing {
  path : string
  value : any
  constructor(path : string, value : any) {
    this.path = path
    this.value = value
  }
  apply(targets, accessor) {
    targets.forEach(target => {
      if (target.isIndexReference()) {
        // setIfMissing do not apply to arrays, since Gradient will reject nulls in arrays
        return
      } else if (target.isAttributeReference()) {
        if (!accessor.has(target.name())) {
          accessor.setRaw(target.name(), this.value)
        }
      } else {
        throw new Error(`Unable to apply to target ${target.toString()}`)
      }
    })
  }
}
