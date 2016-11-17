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
          accessor.getIndex(i).setValue(this.value)
        })
      } else if (target.isAttributeReference()) {
        accessor.get(target.name()).setValue(this.value)
      } else {
        throw new Error(`Unable to apply to target ${target.toString()}`)
      }
    })
  }
}
