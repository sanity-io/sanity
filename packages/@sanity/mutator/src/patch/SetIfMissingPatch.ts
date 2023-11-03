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
        // setIfMissing do not apply to arrays, since Content Lake will reject nulls in arrays
      } else if (target.isAttributeReference()) {
        // setting a subproperty on a primitive value overwrites it, eg
        // `{setIfMissing: {'address.street': 'California St'}}` on `{address: 'Fiction St'}` will
        // result in `{address: {street: 'California St'}}`
        if (result.containerType() === 'primitive') {
          result = result.set({[target.name()]: this.value})
        } else if (!result.hasAttribute(target.name())) {
          result = accessor.setAttribute(target.name(), this.value)
        }
      } else {
        throw new Error(`Unable to apply to target ${target.toString()}`)
      }
    })
    return result
  }
}
