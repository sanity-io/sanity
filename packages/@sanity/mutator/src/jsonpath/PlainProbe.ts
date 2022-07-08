import {isRecord} from '../util'
import type {Probe} from './Probe'

// A default implementation of a probe for vanilla JS _values
export class PlainProbe implements Probe {
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

  length(): number {
    if (!Array.isArray(this._value)) {
      throw new Error("Won't return length of non-indexable _value")
    }

    return this._value.length
  }

  getIndex(i: number): false | null | PlainProbe {
    if (!Array.isArray(this._value)) {
      return false
    }

    if (i >= this.length()) {
      return null
    }

    return new PlainProbe(this._value[i], this.path.concat(i))
  }

  hasAttribute(key: string): boolean {
    if (!isRecord(this._value)) {
      return false
    }

    return this._value.hasOwnProperty(key)
  }

  attributeKeys(): string[] {
    return isRecord(this._value) ? Object.keys(this._value) : []
  }

  getAttribute(key: string): null | PlainProbe {
    if (!isRecord(this._value)) {
      throw new Error('getAttribute only applies to plain objects')
    }

    if (!this.hasAttribute(key)) {
      return null
    }

    return new PlainProbe(this._value[key], this.path.concat(key))
  }

  get(): unknown {
    return this._value
  }
}
