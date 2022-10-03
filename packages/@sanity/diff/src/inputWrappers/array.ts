import type {ArrayInput, Input} from '../types'
import {wrap} from './index'

export default class ArrayWrapper<A> implements ArrayInput<A> {
  type = 'array' as const
  length: number
  value: unknown[]
  annotation: A

  private elements: Input<A>[] = []

  constructor(value: unknown[], annotation: A) {
    this.annotation = annotation
    this.value = value
    this.length = value.length
  }

  at(idx: number): Input<A> {
    if (idx >= this.length) throw new Error('out of bounds')
    const input = this.elements[idx]
    if (input) {
      return input
    }

    return (this.elements[idx] = wrap(this.value[idx], this.annotation))
  }

  annotationAt(): A {
    return this.annotation
  }
}
