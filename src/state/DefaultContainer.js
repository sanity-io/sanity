import applySimplePatch from '../utils/patching/primitive'

export default class DefaultContainer {
  static passSerialized = true;

  static deserialize(rawValue, context) {
    return new DefaultContainer(rawValue, context)
  }

  constructor(value, context) {
    this.value = value
    this.context = context
  }

  patch(patch) {
    return new DefaultContainer(applySimplePatch(this.value, patch), this.context)
  }

  validate() {
    const messages = this.context.field.required && this.value === undefined && [{
      id: 'errors.fieldIsRequired',
      type: 'error',
      message: 'Field is required'
    }]

    return {messages: messages || []}
  }

  serialize() {
    return this.value
  }

  isEmpty() {
    return this.value === undefined
  }

  toJSON() {
    return this.serialize()
  }
}
