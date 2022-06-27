import type {ObjectInput, Input} from '../types'
import {wrap} from './index'

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

  get(key: string): Input<A> | undefined {
    const input = this.fields[key]
    if (input) {
      return input
    }

    if (!this.value.hasOwnProperty(key)) {
      return undefined
    }

    const raw = this.value[key]
    return (this.fields[key] = wrap(raw, this.annotation))
  }
}
