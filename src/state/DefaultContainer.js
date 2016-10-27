// @flow
const PATCH_OPERATIONS = {
  replace(currentValue, nextValue) {
    return nextValue
  },
  set(currentValue, nextValue) {
    return nextValue
  },
  setIfMissing(currentValue, nextValue) {
    return (currentValue === undefined) ? nextValue : currentValue
  },
  unset(currentValue, nextValue) {
    return undefined
  },
  inc(currentValue, nextValue) {
    return currentValue + nextValue
  },
  dec(currentValue, nextValue) {
    return currentValue - nextValue
  }
}

const SUPPORTED_PATCH_TYPES = Object.keys(PATCH_OPERATIONS)

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
    if (!SUPPORTED_PATCH_TYPES.includes(patch.type)) {
      throw new Error(
        `Default value container received patch of unsupported type: "${JSON.stringify(patch.type)}". This is most likely a bug.`
      )
    }

    if (patch.path.length > 0) {
      throw new Error(`Default container cannot apply deep operations. Received patch with type "${patch.type}" and path "${patch.path.join('.')}"`)
    }

    const nextVal = PATCH_OPERATIONS[patch.type](this.value, patch.value)
    return new DefaultContainer(nextVal, this.context)
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
