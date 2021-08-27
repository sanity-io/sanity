import {Validators} from '@sanity/types'
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

  reference: (_unused, value, message) => {
    if (!value) {
      return true
    }

    if (typeof value._ref !== 'string') {
      return message || 'Must be a reference to a document'
    }

    return true
  },

  block: async (validateBlock, value, message, context) => {
    const result = await validateBlock(value, context)
    if (typeof result === 'string') {
      return message || result
    }

    return result
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
