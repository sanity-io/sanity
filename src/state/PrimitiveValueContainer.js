export default class PrimitiveValueContainer {
  static passSerialized = true;

  static deserialize(rawValue, context) {
    return new PrimitiveValueContainer(rawValue, context)
  }

  constructor(value, context) {
    this.value = value
    this.context = context
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
    return typeof this.value === 'undefined'
  }

  toJSON() {
    return this.serialize()
  }

  containerType() {
    return 'primitive'
  }

  get() {
    return this.value
  }

}
