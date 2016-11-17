// @flow

// An immutable probe/accessor for plain JS objects that will never mutate
// the provided _value in place
export default class ImmutableAccessor {
  setter : Function
  getter : Function
  constructor(getter : Function, setter : Function) {
    this.getter = getter
    this.setter = setter
  }
  // Probe interface (the interface used by Matcher to traverse the document)
  isIndexable() : bool {
    return Array.isArray(this.getter())
  }
  getLength() : number {
    if (!this.isIndexable()) {
      throw new Error("Won't return length of non-indexable _value")
    }
    return this.getter().length
  }
  isPlainObject() : bool {
    return typeof this.getter() == 'object' && !this.isIndexable()
  }
  isPrimitiveValue() : bool {
    return !this.isPlainObject() && !this.isIndexable()
  }
  has(key : string) : bool {
    if (!this.isPlainObject()) {
      return false
    }
    return this.getter().hasOwnProperty(key)
  }
  attributes() : Array<string> {
    if (!this.isPlainObject()) {
      return []
    }
    return Object.keys(this.getter())
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
    if (!this.isPlainObject()) {
      throw new Error('get only works on plain Objects')
    }
    return new ImmutableAccessor(
      () => this.getter()[key],
      _value => {
        const newValue = Object.assign({}, this.getter())
        newValue[key] = _value
        this.setter(newValue)
      })
  }
  getIndex(i : number) : any {
    if (!this.isIndexable()) {
      throw new Error('get only works on indicies')
    }
    if (!this.hasIndex(i)) {
      return null
    }
    return new ImmutableAccessor(
      () => this.getter()[i],
      _value => {
        if (i < 0 || i >= this.getLength()) {
          throw new Error('Index out of range')
        }
        const newValue = this.getter().slice()
        newValue[i] = _value
        this.setter(newValue)
      })
  }
  value() : any {
    if (!this.isPrimitiveValue()) {
      throw new Error("Won't give value of collections")
    }
    return this.getter()
  }
  // TODO: Should not accept collections except empty ones
  set(value) {
    this.setter(value)
  }

  deleteKey(key : string) {
    this._mutate(_value => {
      delete _value[key]
      return _value
    })
  }
  deleteIndicies(indicies : Array<number>) {
    this._mutate(_value => {
      const length = _value.length
      const newValue = []
      // Copy every _value _not_ in the indicies array over to the newValue
      for (let i = 0; i < length; i++) {
        if (indicies.indexOf(i) == -1) {
          newValue.push(_value[i])
        }
      }
      return newValue
    })
  }
  insert(pos : number, items : Array<any>) {
    this._mutate(_value => {
      if (this.getLength() == 0 && pos == 0) {
        return items
      }
      return _value.slice(0, pos).concat(items).concat(_value.slice(pos))
    })
  }
  mutate(fn : Function) {
    if (!this.isPrimitiveValue()) {
      throw new Error("Won't mutate container types")
    }
    this._mutate(fn)
  }
  // Not part of the Accessor protocol
  _mutate(fn : Function) {
    let val = this.getter()
    // Make sure we send a copy to the mutator
    if (Array.isArray(val)) {
      val = val.slice()
    } else if (typeof val == 'object') {
      val = Object.assign({}, val)
    }
    this.setter(fn(val))
  }
}
