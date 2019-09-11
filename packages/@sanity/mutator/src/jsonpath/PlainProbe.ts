// A default implementation of a probe for vanilla JS _values
export default class PlainProbe {
  _value: any
  path: Array<any>
  constructor(_value: any, path?: Array<any>) {
    this._value = _value
    this.path = path || []
  }
  containerType() {
    if (Array.isArray(this._value)) {
      return 'array'
    } else if (this._value !== null && typeof this._value === 'object') {
      return 'object'
    }
    return 'primitive'
  }

  length(): number {
    if (this.containerType() !== 'array') {
      throw new Error("Won't return length of non-indexable _value")
    }
    return this._value.length
  }
  getIndex(i: number): any {
    if (this.containerType() !== 'array') {
      return false
    }
    if (i >= this.length()) {
      return null
    }
    return new PlainProbe(this._value[i], this.path.concat(i))
  }

  hasAttribute(key: string): boolean {
    if (this.containerType() !== 'object') {
      return false
    }
    return this._value.hasOwnProperty(key)
  }
  attributeKeys(): Array<string> {
    if (this.containerType() !== 'object') {
      return []
    }
    return Object.keys(this._value)
  }
  getAttribute(key: string): any {
    if (this.containerType() !== 'object') {
      throw new Error('getAttribute only applies to plain objects')
    }
    if (!this.hasAttribute(key)) {
      return null
    }
    return new PlainProbe(this._value[key], this.path.concat(key))
  }

  get(): any {
    return this._value
  }
}
