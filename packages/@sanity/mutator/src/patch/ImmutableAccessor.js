// @flow

// An immutable probe/accessor for plain JS objects that will never mutate
// the provided value in place
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
      throw new Error("Won't return length of non-indexable value")
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
  get(key : string) : any {
    if (this.isIndexable()) {
      return null
    }
    if (!this.has(key)) {
      return null
    }
    return new ImmutableAccessor(
      () => this.getRaw(key),
      value => {
        this.setRaw(key, value)
      })
  }
  getIndex(i : number) : any {
    if (!this.isIndexable()) {
      return false
    }
    if (!this.hasIndex(i)) {
      return null
    }
    return new ImmutableAccessor(
      () => this.getIndexRaw(i),
      value => {
        this.setIndexRaw(i, value)
      })
  }
  getValue() : any {
    if (!this.isPrimitiveValue()) {
      throw new Error("Won't give primitive value of collections")
    }
    return this.getter()
  }

  // Accessor interface (the interface used by Patcher to mutate the document)
  getRaw(key : string) : any {
    return this.getter()[key]
  }
  getIndexRaw(i : number) : any {
    return this.getter()[i]
  }
  setRaw(key : string, value : any) {
    if (!this.isPlainObject()) {
      throw new Error("Can't set key of non-plain object")
    }
    const obj = Object.assign({}, this.getter())
    obj[key] = value
    this.setter(obj)
  }
  setIndexRaw(i : number, value : any) {
    if (!this.isIndexable()) {
      throw new Error("Can't set array member of non-plain object")
    }
    const array = this.getter().slice()
    array[i] = value
    this.setter(array)
  }
  delete(key : string) {
    this._mutate(value => {
      delete value[key]
      return value
    })
  }
  deleteIndicies(indicies : Array<number>) {
    this._mutate(value => {
      const length = value.length
      const newValue = []
      // Copy every value _not_ in the indicies array over to the newValue
      for (let i = 0; i < length; i++) {
        if (indicies.indexOf(i) == -1) {
          newValue.push(value[i])
        }
      }
      return newValue
    })
  }
  insert(pos : number, items : Array<any>) {
    this._mutate(value => {
      if (this.getLength() == 0 && pos == 0) {
        return items
      }
      return value.slice(0, pos).concat(items).concat(value.slice(pos))
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
