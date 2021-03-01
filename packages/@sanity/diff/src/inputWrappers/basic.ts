type SimpleType = 'boolean' | 'number' | 'null'

export default class BasicWrapper<K extends SimpleType, V, A> {
  type: K
  value: V
  annotation: A

  constructor(type: K, value: V, annotation: A) {
    this.type = type
    this.value = value
    this.annotation = annotation
  }
}
