import {type Expression} from '../jsonpath'
import {type ImmutableAccessor} from './ImmutableAccessor'

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
        if (result.containerType() === 'array') {
          target.toIndicies(accessor).forEach((i) => {
            // A write at exactly `length` appends contiguously; anything past that
            // would leave `undefined` holes in the array, so those writes are dropped
            if (i < 0 || i > result.length()) {
              return
            }

            result = result.setIndex(i, this.value)
          })
        }
      } else if (target.isAttributeReference()) {
        // setting a subproperty on a primitive value overwrites it, eg
        // `{set: {'address.street': 'California St'}}` on `{address: 'Fiction St'}` will result in
        // `{address: {street: 'California St'}}`
        if (result.containerType() === 'primitive') {
          result = result.set({[target.name()]: this.value})
        } else {
          result = result.setAttribute(target.name(), this.value)
        }
      } else {
        throw new Error(`Unable to apply to target ${target.toString()}`)
      }
    })
    return result
  }
}
