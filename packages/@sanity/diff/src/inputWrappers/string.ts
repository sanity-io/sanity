import {StringInput} from '../types'

export default class StringWrapper<A> implements StringInput<A> {
  type: 'string' = 'string'
  value: string
  annotation: A

  constructor(value: string, annotation: A) {
    this.value = value
    this.annotation = annotation
  }

  sliceAnnotation(start: number, end: number) {
    return [{text: this.value.slice(start, end), annotation: this.annotation}]
  }
}
