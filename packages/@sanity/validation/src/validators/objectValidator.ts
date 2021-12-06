import {Validators, isReference} from '@sanity/types'
import genericValidator from './genericValidator'

const metaKeys = ['_key', '_type', '_weak']

const objectValidators: Validators = {
  ...genericValidator,

  presence: (expected, value, message) => {
    if (expected !== 'required') {
      return true
    }

    const keys = value && Object.keys(value).filter((key) => !metaKeys.includes(key))

    if (value === undefined || (keys && keys.length === 0)) {
      return message || 'Required'
    }

    return true
  },

  reference: async (_unused, value: unknown, message, context) => {
    if (!value) {
      return true
    }

    if (!isReference(value)) {
      return message || true
    }

    const {type, getDocumentExists} = context

    if (!type) {
      throw new Error(`\`type\` was not provided in validation context`)
    }

    if ('weak' in type && type.weak) {
      return true
    }

    if (!getDocumentExists) {
      throw new Error(`\`getDocumentExists\` was not provided in validation context`)
    }

    const exists = await getDocumentExists({id: value._ref})
    if (!exists) {
      return 'This reference must be published'
    }

    return true
  },

  assetRequired: (flag, value, message) => {
    if (!value || !value.asset || !value.asset._ref) {
      const assetType = flag.assetType || 'Asset'
      return message || `${assetType} required`
    }

    return true
  },
}

export default objectValidators
