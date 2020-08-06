import {ArrayInput, Input} from '../types'
import {wrap} from '.'

export default class ArrayWrapper<A> implements ArrayInput<A> {
  type: 'array' = 'array'
  length: number
  value: unknown[]
  annotation: A

  private elements: Input<A>[] = []

  constructor(value: unknown[], annotation: A) {
    this.annotation = annotation
    this.value = value
    this.length = value.length
  }

  at(idx: number) {
    if (idx >= this.length) throw new Error('out of bounds')
    let input = this.elements[idx]
    if (input) {
      return input
    } else {
      return (this.elements[idx] = wrap(this.value[idx], this.annotation))
    }
  }
}
