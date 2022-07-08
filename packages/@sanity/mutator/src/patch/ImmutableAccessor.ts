import type {Probe} from '../jsonpath/Probe'

/**
 * An immutable probe/writer for plain JS objects that will never mutate
 * the provided _value in place. Each setter returns a new (wrapped) version
 * of the value.
 */
export class ImmutableAccessor implements Probe {
  _value: unknown
  path: (string | number)[]

  constructor(value: unknown, path?: (string | number)[]) {
    this._value = value
    this.path = path || []
  }

  containerType(): 'array' | 'object' | 'primitive' {
    if (Array.isArray(this._value)) {
      return 'array'
    } else if (this._value !== null && typeof this._value === 'object') {
      return 'object'
    }
    return 'primitive'
  }

  // Common reader, supported by all containers
  get(): unknown {
    return this._value
  }

  // Array reader
  length(): number {
    if (!Array.isArray(this._value)) {
      throw new Error("Won't return length of non-indexable _value")
    }

    return this._value.length
  }

  getIndex(i: number): ImmutableAccessor | false | null {
    if (!Array.isArray(this._value)) {
      return false
    }

    if (i >= this.length()) {
      return null
    }

    return new ImmutableAccessor(this._value[i], this.path.concat(i))
  }

  // Object reader
  hasAttribute(key: string): boolean {
    return isRecord(this._value) ? this._value.hasOwnProperty(key) : false
  }

  attributeKeys(): string[] {
    return isRecord(this._value) ? Object.keys(this._value) : []
  }

  getAttribute(key: string): ImmutableAccessor | null {
    if (!isRecord(this._value)) {
      throw new Error('getAttribute only applies to plain objects')
    }

    if (!this.hasAttribute(key)) {
      return null
    }

    return new ImmutableAccessor(this._value[key], this.path.concat(key))
  }

  // Common writer, supported by all containers
  set(value: unknown): ImmutableAccessor {
    return value === this._value ? this : new ImmutableAccessor(value, this.path)
  }

  // array writer interface
  setIndex(i: number, value: unknown): ImmutableAccessor {
    if (!Array.isArray(this._value)) {
      throw new Error('setIndex only applies to arrays')
    }

    if (value === this._value[i]) {
      return this
    }

    const nextValue = this._value.slice()
    nextValue[i] = value
    return new ImmutableAccessor(nextValue, this.path)
  }

  setIndexAccessor(i: number, accessor: ImmutableAccessor): ImmutableAccessor {
    return this.setIndex(i, accessor.get())
  }

  unsetIndices(indices: number[]): ImmutableAccessor {
    if (!Array.isArray(this._value)) {
      throw new Error('unsetIndices only applies to arrays')
    }

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

  insertItemsAt(pos: number, items: unknown[]): ImmutableAccessor {
    if (!Array.isArray(this._value)) {
      throw new Error('insertItemsAt only applies to arrays')
    }

    let nextValue
    if (this._value.length === 0 && pos === 0) {
      nextValue = items
    } else {
      nextValue = this._value.slice(0, pos).concat(items).concat(this._value.slice(pos))
    }

    return new ImmutableAccessor(nextValue, this.path)
  }

  // Object writer interface
  setAttribute(key: string, value: unknown): ImmutableAccessor {
    if (!isRecord(this._value)) {
      throw new Error('Unable to set attribute of non-object container')
    }

    if (value === this._value[key]) {
      return this
    }

    const nextValue = Object.assign({}, this._value, {[key]: value})
    return new ImmutableAccessor(nextValue, this.path)
  }

  setAttributeAccessor(key: string, accessor: ImmutableAccessor): ImmutableAccessor {
    return this.setAttribute(key, accessor.get())
  }

  unsetAttribute(key: string): ImmutableAccessor {
    if (!isRecord(this._value)) {
      throw new Error('Unable to unset attribute of non-object container')
    }

    const nextValue = Object.assign({}, this._value)
    delete nextValue[key]
    return new ImmutableAccessor(nextValue, this.path)
  }
}

function isRecord(value: unknown): value is {[key: string]: unknown} {
  return value !== null && typeof value === 'object'
}
