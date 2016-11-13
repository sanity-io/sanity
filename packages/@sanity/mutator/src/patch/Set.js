export default class Set {
  path : string
  value : any
  constructor(path : string, value : any) {
    this.path = path
    this.value = value
  }
  apply(targets, accessor) {
    targets.forEach(target => {
      if (target.isIndexReference()) {
        target.toIndicies(accessor).forEach(i => {
          accessor.setIndexRaw(i, this.value)
        })
      } else if (target.isAttributeReference()) {
        accessor.setRaw(target.name(), this.value)
      } else {
        throw new Error(`Unable to apply to target ${target.toString()}`)
      }
    })
  }
}
