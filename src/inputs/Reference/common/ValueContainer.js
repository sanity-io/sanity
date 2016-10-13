export default class ReferenceContainer {

  static deserialize(rawValue, context) {
    return new ReferenceContainer(rawValue, context)
  }

  constructor(value, context) {
    this.value = value
    this.context = context
  }

  get refId() {
    return this.value && this.value._ref
  }

  patch(patch) {
    if (patch.hasOwnProperty('$set')) {
      return new ReferenceContainer(patch.$set, this.context)
    }
    throw new Error(`Only $set is supported by reference value container, got: ${JSON.stringify(patch)}`)
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
