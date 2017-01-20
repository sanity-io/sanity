import {ImmutableAccessor} from '@sanity/mutator'


import accessorForSlateValue from './accessorForSlateValue'
import fromSlate from '../../../../src/inputs/BlockEditor-slate/conversion/fromSlate'
import toSlate from '../../../../src/inputs/BlockEditor-slate/conversion/toSlate'
import {SLATE_BLOCK_FORMATTING_OPTION_KEYS} from '../../../../src/inputs/BlockEditor-slate/constants'

const STANDARD_BLOCK_KEYS = ['key', '_type', 'children']

export default class BlockAccessor {
  constructor(value) {
    this.value = value
  }

  containerType() {
    return 'object'
  }

  isValidAttributeKey(key) {
    return STANDARD_BLOCK_KEYS.includes(key) || SLATE_BLOCK_FORMATTING_OPTION_KEYS.includes(key)
  }

  hasAttribute(key) {
    return this.attributeKeys().includes(key)
  }

  getAttribute(key) {
    switch (key) {
      case '_type':
        return new ImmutableAccessor(this.value.get('type'))
      case 'children':
        return accessorForSlateValue(this.value.get('nodes'))
      default:
        if (this.hasAttribute(key)) {
          return accessorForSlateValue(this.value.get(key))
        }
        throw new Error(`Attempt to get non-existent attribute '${key}' of Block`)
    }
  }

  setAttribute(key, value) {
    let nextValue = this.value
    switch (key) {
      case 'key':
        nextValue = nextValue.set('key', value)
        break
      case '_type':
        nextValue = nextValue.set('type', value)
        break
      case 'children':
        nextValue = nextValue.set('nodes', toSlate(value))
        break
      default:
        if (this.isValidAttributeKey(key)) {
          nextValue = nextValue.set(key, toSlate(value))
        } else {
          throw new Error(`Attempt to set invalid attribute '${key}' of Block`)
        }
    }
    return new BlockAccessor(nextValue)
  }

  unset(key) {
    if (!this.isValidAttributeKey(key)) {
      throw new Error(`Attempt to unset invalid attribute '${key}' of Block`)
    }
    return new BlockAccessor(this.value.delete(key))
  }

  attributeKeys() {
    if (!this._keys) {
      this._keys = STANDARD_BLOCK_KEYS
      SLATE_BLOCK_FORMATTING_OPTION_KEYS.forEach(key => {
        if (this.value.has(key)) {
          this._keys.push(key)
        }
      })
    }
  }

  set(nextValue) {
    // TODO: value might not be a block so must use polymorphic wrapper when we have it
    return new BlockAccessor(toSlate(nextValue))
  }

  get() {
    return fromSlate(this.value)
  }
}
