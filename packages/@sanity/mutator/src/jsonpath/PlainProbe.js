// @flow

// A default implementation of a probe for vanilla JS values
export default class PlainProbe {
  value : any
  constructor(value : any) {
    this.value = value
  }
  isIndexable() : bool {
    return Array.isArray(this.value)
  }
  getLength() : bool {
    if (!this.isIndexable()) {
      throw new Error("Won't return length of non-indexable value")
    }
    return this.value.length
  }
  isPlainObject() : bool {
    return typeof this.value == 'object' && !this.isIndexable()
  }
  isPrimitiveValue() : bool {
    return !this.isPlainObject() && !this.isIndexable()
  }
  has(key : string) : bool {
    if (this.isIndexable()) {
      return false
    }
    return Object.keys(this.value).indexOf(key) != -1
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
  get(key : string) : any {
    if (this.isIndexable()) {
      return false
    }
    if (!this.has(key)) {
      return null
    }
    return new PlainProbe(this.value[key])
  }
  getIndex(i : number) : any {
    if (!this.isIndexable()) {
      return false
    }
    if (!this.hasIndex(i)) {
      return null
    }
    return new PlainProbe(this.value[i])
  }
  getValue() : any {
    if (!this.isPrimitiveValue()) {
      throw new Error("Won't give primitive value of collections")
    }
    return this.value
  }
}
