export default class IncPatch {
  path : string
  value : number
  constructor(path : string, value : number) {
    this.path = path
    this.value = value
  }
  apply(targets, accessor) {
    let result = accessor
    targets.forEach(target => {
      if (target.isIndexReference()) {
        target.toIndicies(accessor).forEach(i => {
          const previousValue = result.getIndex(i).value()
          result = result.setIndex(i, previousValue + this.value)
        })
      } else if (target.isAttributeReference()) {
        const previousValue = result.getAttribute(target.name()).value()
        result = result.setAttribute(target.name(), previousValue + this.value)
      } else {
        throw new Error(`Unable to apply to target ${target.toString()}`)
      }
    })
    return result
  }
}
