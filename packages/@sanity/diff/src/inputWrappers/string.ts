import type {StringInput} from '../types'

export default class StringWrapper<A> implements StringInput<A> {
  type = 'string' as const
  value: string
  annotation: A

  constructor(value: string, annotation: A) {
    this.value = value
    this.annotation = annotation
  }

  sliceAnnotation(start: number, end: number): {text: string; annotation: A}[] {
    return [{text: this.value.slice(start, end), annotation: this.annotation}]
  }
}
