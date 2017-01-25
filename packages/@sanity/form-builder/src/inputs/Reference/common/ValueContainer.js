import {ImmutableAccessor} from '@sanity/mutator'
import hasOwn from '../../../utils/hasOwn'

const VALID_KEYS = ['_type', '_ref', '_key']

export default class ReferenceContainer {

  static deserialize(serialized = {}, context) {
    const deserialized = {_type: 'reference'}
    if (serialized) {
      if (hasOwn(serialized, '_key')) {
        deserialized._key = serialized._key
      }
      if (hasOwn(serialized, '_ref')) {
        deserialized._ref = serialized._ref
      }
    }
    return new ReferenceContainer(deserialized, context)
  }

  constructor(value, context) {
    this.context = context
    this.value = value
  }

  validate() {
    const messages = this.context.type.required && this.value === undefined && [{
      id: 'errors.fieldIsRequired',
      type: 'error',
      message: 'Field is required'
    }]

    return {messages: messages || []}
  }

  get refId() {
    return this.value && this.value._ref
  }

  serialize() {
    const serialized = {}
    if (hasOwn(this.value, '_key')) {
      serialized._key = this.value._key
    }
    if (hasOwn(this.value, '_ref')) {
      serialized._ref = this.value._ref
    }

    return Object.keys(serialized).length
      ? Object.assign({_type: 'reference'}, serialized)
      : undefined
  }

  get key() {
    return this.value._key
  }

  toJSON() {
    return this.serialize()
  }

  // Accessor methods
  containerType() {
    return 'object'
  }

  hasAttribute(key) {
    return VALID_KEYS.includes(key)
  }

  getAttribute(key) {
    return new ImmutableAccessor(this.value[key])
  }

  setAttribute(key, value) {
    const nextValue = Object.assign({}, this.value, {
      [key]: value
    })
    return new ReferenceContainer(nextValue, this.context)
  }

  unsetAttribute(fieldName) {
    return this.setAttribute(fieldName, undefined)
  }

  attributeKeys() {
    return VALID_KEYS
  }

  set(nextValue) {
    return ReferenceContainer.deserialize(nextValue, this.context)
  }

  get() {
    return this.serialize()
  }

  isEmpty() {
    return this.value._ref === undefined
  }

}
