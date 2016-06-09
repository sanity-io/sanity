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
    if (patch.hasOwnProperty('$set')) {
      return new DefaultContainer(patch.$set, this.context)
    }
    throw new Error(`Only $set is supported by default value container, got: ${JSON.stringify(patch)}`)
  }

  validate() {
    const {field} = this.context
    if (field.required && this.value === undefined) {
      return [{id: 'required'}]
    }
  }

  serialize() {
    return this.value
  }
}
