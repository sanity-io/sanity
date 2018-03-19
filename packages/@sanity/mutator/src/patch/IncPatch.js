export default class IncPatch {
  path: string
  value: number
  id: string
  constructor(id: string, path: string, value: number) {
    this.path = path
    this.value = value
    this.id = id
  }
  apply(targets, accessor) {
    let result = accessor
    targets.forEach(target => {
      if (target.isIndexReference()) {
        target.toIndicies(accessor).forEach(i => {
          const previousValue = result.getIndex(i).get()
          result = result.setIndex(i, previousValue + this.value)
        })
      } else if (target.isAttributeReference()) {
        const previousValue = result.getAttribute(target.name()).get()
        result = result.setAttribute(target.name(), previousValue + this.value)
      } else {
        throw new Error(`Unable to apply to target ${target.toString()}`)
      }
    })
    return result
  }
}
