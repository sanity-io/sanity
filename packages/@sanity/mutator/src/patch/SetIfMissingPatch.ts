import type {Expression} from '../jsonpath'
import type {ImmutableAccessor} from './ImmutableAccessor'

export class SetIfMissingPatch {
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
      if (target.isIndexReference()) {
        // setIfMissing do not apply to arrays, since Gradient will reject nulls in arrays
      } else if (target.isAttributeReference()) {
        if (!result.hasAttribute(target.name())) {
          result = accessor.setAttribute(target.name(), this.value)
        }
      } else {
        throw new Error(`Unable to apply to target ${target.toString()}`)
      }
    })
    return result
  }
}
