// An immutable probe/writer for plain JS objects that will never mutate
// the provided _value in place. Each setter returns a new (wrapped) version
// of the value.
export default class ImmutableAccessor {
  _value: any
  path: Array<any>
  constructor(_value: any, path?: any) {
    this._value = _value
    this.path = path || []
  }
  containerType() {
    if (Array.isArray(this._value)) {
      return 'array'
    } else if (this._value !== null && typeof this._value == 'object') {
      return 'object'
    }
    return 'primitive'
  }

  // Common reader, supported by all containers
  get(): any {
    return this._value
  }

  // Array reader
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
    return new ImmutableAccessor(this._value[i], this.path.concat(i))
  }

  // Object reader
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
    return new ImmutableAccessor(this._value[key], this.path.concat(key))
  }

  // Common writer, supported by all containers
  set(value) {
    if (value === this._value) {
      return this
    }
    return new ImmutableAccessor(value, this.path)
  }

  setAccessor(accessor) {
    return accessor
  }

  // array writer interface
  setIndex(i: number, value: any) {
    if (value === this._value[i]) {
      return this
    }
    const nextValue = this._value.slice()
    nextValue[i] = value
    return new ImmutableAccessor(nextValue, this.path)
  }
  setIndexAccessor(i: number, accessor) {
    return this.setIndex(i, accessor.get())
  }
  unsetIndices(indices: Array<number>) {
    const length = this._value.length
    const nextValue = []
    // Copy every _value _not_ in the indices array over to the newValue
    for (let i = 0; i < length; i++) {
      if (indices.indexOf(i) === -1) {
        nextValue.push(this._value[i])
      }
    }
    return new ImmutableAccessor(nextValue, this.path)
  }
  insertItemsAt(pos: number, items: Array<any>) {
    let nextValue
    if (this.length() === 0 && pos === 0) {
      nextValue = items
    } else {
      nextValue = this._value.slice(0, pos).concat(items).concat(this._value.slice(pos))
    }
    return new ImmutableAccessor(nextValue, this.path)
  }

  // Object writer interface
  setAttribute(key: string, value: any) {
    if (this.containerType() !== 'object') {
      throw new Error('Unable to set attribute of non-object container')
    }
    if (value === this._value[key]) {
      return this
    }
    const nextValue = Object.assign({}, this._value)
    nextValue[key] = value
    return new ImmutableAccessor(nextValue, this.path)
  }
  setAttributeAccessor(key: string, accessor) {
    return this.setAttribute(key, accessor.get())
  }
  unsetAttribute(key: string) {
    if (this.containerType() != 'object') {
      throw new Error('Unable to unset attribute of non-object container')
    }
    const nextValue = Object.assign({}, this._value)
    delete nextValue[key]
    return new ImmutableAccessor(nextValue, this.path)
  }

  // primitive writer interface
  mutate(fn: Function) {
    if (this.containerType() != 'primitive') {
      throw new Error("Won't mutate container types")
    }
    const nextValue = fn(this._value)
    return new ImmutableAccessor(nextValue, this.path)
  }
}
