export default class DefaultContainer {
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

  unwrap() {
    return this.value
  }
}

DefaultContainer.passUnwrapped = true
