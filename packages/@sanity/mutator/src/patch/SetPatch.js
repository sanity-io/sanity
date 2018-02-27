// @flow
import Expression from '../jsonpath/Expression'

export default class SetPatch {
  path: string
  value: any
  id: string
  constructor(id: string, path: string, value: any) {
    this.id = id
    this.path = path
    this.value = value
  }
  apply(targets: Array<Expression>, accessor: Object) {
    let result = accessor
    targets.forEach(target => {
      if (target.isSelfReference()) {
        result = result.set(this.value)
      } else if (target.isIndexReference()) {
        target.toIndicies(accessor).forEach(i => {
          result = result.setIndex(i, this.value)
        })
      } else if (target.isAttributeReference()) {
        result = result.setAttribute(target.name(), this.value)
      } else {
        throw new Error(`Unable to apply to target ${target.toString()}`)
      }
    })
    return result
  }
}
