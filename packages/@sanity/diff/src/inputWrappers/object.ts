import {ObjectInput, Input} from '../types'
import {wrap} from '.'

export default class ObjectWrapper<A> implements ObjectInput<A> {
  type: 'object' = 'object'
  value: Record<string, unknown>
  keys: string[]
  annotation: A

  private fields: Record<string, Input<A>> = {}

  constructor(value: Record<string, unknown>, annotation: A) {
    this.value = value
    this.annotation = annotation
    this.keys = Object.keys(value)
  }

  get(key: string) {
    let input = this.fields[key]
    if (input) {
      return input
    } else {
      if (!this.value.hasOwnProperty(key)) return
      let raw = this.value[key]
      return (this.fields[key] = wrap(raw, this.annotation))
    }
  }
}
