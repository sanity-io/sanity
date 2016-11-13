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
          const val = accessor.getIndexRaw(i)
          if (typeof val == 'number') {
            accessor.setIndexRaw(i, val + this.value)
          }
        })
      } else if (target.isAttributeReference()) {
        const val = accessor.getRaw(target.name())
        if (typeof val == 'number') {
          accessor.setRaw(target.name(), val + this.value)
        }
      } else {
        throw new Error(`Unable to apply to target ${target.toString()}`)
      }
    })
  }
}
