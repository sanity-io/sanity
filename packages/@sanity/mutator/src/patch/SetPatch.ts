import type {Expression} from '../jsonpath'
import type {ImmutableAccessor} from './ImmutableAccessor'

export class SetPatch {
  id: string
  path: string
  value: unknown

  constructor(id: string, path: string, value: unknown) {
    this.id = id
    this.path = path
    this.value = value
  }

  apply(targets: Expression[], accessor: ImmutableAccessor): ImmutableAccessor {
    let result = accessor
    targets.forEach((target) => {
      if (target.isSelfReference()) {
        result = result.set(this.value)
      } else if (target.isIndexReference()) {
        target.toIndicies(accessor).forEach((i) => {
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
