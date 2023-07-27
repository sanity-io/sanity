import {type Validators, isReference} from '@sanity/types'
import {genericValidators} from './genericValidator'

const metaKeys = ['_key', '_type', '_weak']

export const objectValidators: Validators = {
  ...genericValidators,

  presence: (expected, value, message, {i18n}) => {
    if (expected !== 'required') {
      return true
    }

    const keys = value && Object.keys(value).filter((key) => !metaKeys.includes(key))

    if (value === undefined || (keys && keys.length === 0)) {
      return message || i18n.t('validation:generic.required', {context: 'object'})
    }

    return true
  },

  reference: async (_unused, value: unknown, message, context) => {
    if (!value) {
      return true
    }

    const {type, getDocumentExists, i18n} = context

    if (!isReference(value)) {
      return message || i18n.t('validation:object.not-reference')
    }

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
      return i18n.t('validation:object.reference-not-published', {documentId: value._ref})
    }

    return true
  },

  assetRequired: (flag, value, message, {i18n}) => {
    if (!value || !value.asset || !value.asset._ref) {
      return message || i18n.t('validation:object.asset-required', {context: flag.assetType || ''})
    }

    return true
  },
}
