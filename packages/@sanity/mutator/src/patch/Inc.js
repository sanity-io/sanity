export default class Set {
  path : string
  value : number
  constructor(path : string, value : number) {
    this.path = path
    this.value = value
  }
  apply(targets, accessor) {
    targets.forEach(target => {
      if (target.isIndexReference()) {
        target.toIndicies(accessor).forEach(i => {
          accessor.getIndex(i).mutate(value => {
            return value + this.value
          })
        })
      } else if (target.isAttributeReference()) {
        accessor.get(target.name()).mutate(value => {
          return value + this.value
        })
      } else {
        throw new Error(`Unable to apply to target ${target.toString()}`)
      }
    })
  }
}
