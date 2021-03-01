function performIncrement(previousValue, delta) {
  if (!Number.isFinite(previousValue)) return previousValue
  return previousValue + delta
}

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
    // The target must be a container type
    if (result.containerType() == 'primitive') {
      return result
    }
    targets.forEach((target) => {
      if (target.isIndexReference()) {
        target.toIndicies(accessor).forEach((i) => {
          // Skip patching unless the index actually currently exists
          if (result.getIndex(i)) {
            const previousValue = result.getIndex(i).get()
            result = result.setIndex(i, performIncrement(previousValue, this.value))
          }
        })
      } else if (target.isAttributeReference() && result.hasAttribute(target.name())) {
        const previousValue = result.getAttribute(target.name()).get()
        result = result.setAttribute(target.name(), performIncrement(previousValue, this.value))
      } else {
        throw new Error(`Unable to apply to target ${target.toString()}`)
      }
    })
    return result
  }
}
