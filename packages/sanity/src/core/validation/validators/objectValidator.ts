import {isReference, type Validators} from '@sanity/types'

import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../../releases/util/releasesClient'
import {getPublishedId} from '../../util'
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

    const {type, document, getDocumentExists, i18n, getClient} = context

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

    const documentId = document?._id
    if (documentId && value._ref == getPublishedId(documentId)) {
      // a document should be able to reference itself without first being published
      return true
    }

    const exists = await getDocumentExists({id: value._ref})
    if (!exists) {
      const publishedDocumentExists = await getClient(RELEASES_STUDIO_CLIENT_OPTIONS)
        .getDocument(value._ref)
        .then((result) => !!result)
        .catch(() => false)

      /**
       * If publishedDocumentExists then getDocumentExists is returning false
       * because the published document will be unpublished in the current release
       */
      if (publishedDocumentExists) {
        return i18n.t('validation:object.reference-deleted', {documentId: value._ref})
      }

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
