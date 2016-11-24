// @flow

// A default implementation of a probe for vanilla JS _values
export default class PlainProbe {
  _value : any
  path : Array<any>
  constructor(_value : any, path : Array<any>) {
    this._value = _value
    this.path = path || []
  }
  isIndexable() : bool {
    return Array.isArray(this._value)
  }
  getLength() : number {
    if (!this.isIndexable()) {
      throw new Error("Won't return length of non-indexable _value")
    }
    return this._value.length
  }
  isPlainObject() : bool {
    return this._value !== null && typeof this._value == 'object' && !this.isIndexable()
  }
  isPrimitiveValue() : bool {
    return !this.isPlainObject() && !this.isIndexable()
  }
  has(key : string) : bool {
    if (!this.isPlainObject()) {
      return false
    }
    return this._value.hasOwnProperty(key)
  }
  attributes() : Array<string> {
    if (!this.isPlainObject()) {
      return []
    }
    return Object.keys(this._value)
  }
  hasIndex(i : number) : bool {
    if (!this.isIndexable()) {
      return false
    }
    if (i >= this.getLength()) {
      return false
    }
    return true
  }
  getField(key : string) : any {
    if (this.isIndexable()) {
      return false
    }
    if (!this.has(key)) {
      return null
    }
    return new PlainProbe(this._value[key], this.path.concat(key))
  }
  getIndex(i : number) : any {
    if (!this.isIndexable()) {
      return false
    }
    if (!this.hasIndex(i)) {
      return null
    }
    return new PlainProbe(this._value[i], this.path.concat(i))
  }
  value() : any {
    if (!this.isPrimitiveValue()) {
      throw new Error("Won't give value of collections")
    }
    return this._value
  }
}
