import {
  type Asset as MediaLibraryAsset,
  type AssetInstanceDocument,
} from '@sanity/media-library-types'
import {type CustomValidatorResult, isReference, type Validators} from '@sanity/types'

import {getPublishedId} from '../../util/draftUtils'
import {isLocalizedMessages, localizeMessage} from '../util/localizeMessage'
import {pathToString} from '../util/pathToString'
import {genericValidators, SLOW_VALIDATOR_TIMEOUT} from './genericValidator'

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

    const {type, document, getDocumentExists, i18n} = context

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

  media: async (fn, value, message, context) => {
    const slowTimer = setTimeout(() => {
      // only show this warning in the studio
      if (context.environment !== 'studio') return

      console.warn(
        `Media validator at ${pathToString(
          context.path,
        )} has taken more than ${SLOW_VALIDATOR_TIMEOUT}ms to respond`,
      )
    }, SLOW_VALIDATOR_TIMEOUT)

    // If no value is provided, we assume the validation passes. This should be handled by the 'isRequired' validator.
    if (!value) {
      return true
    }

    // If the value is not an object or does not have a media reference, we return an error message.
    // It should not be allowed to use regular dataset assets with this validator.
    if (!value || !value.media || !value.media._ref) {
      return context.i18n.t('validation:object.not-media-library-asset')
    }

    let result: CustomValidatorResult = true

    try {
      const [type, libraryId, documentId] = value.media._ref.split(':', 3)
      // TODO: replace this with stable resource config when available
      const resourceConfig = {'~experimental_resource': {type, id: libraryId}}
      const asset = await context
        .getClient({apiVersion: '2025-02-19'})
        .withConfig(resourceConfig)
        .fetch<
          (MediaLibraryAsset & {currentVersion: AssetInstanceDocument}) | null
        >(`*[_id == $id] { ..., 'currentVersion': @.currentVersion-> { ... }  }[0]`, {
          id: documentId,
        })
      if (!asset) {
        console.warn(
          `${context.i18n.t('validation:object.media-not-found')}\nAsset ID: ${value.media._ref}`,
        )
        return context.i18n.t('validation:object.media-not-found')
      }

      result = await fn(
        {
          media: {
            asset,
          },
          value,
        },
        context,
      )
    } catch (err) {
      const error = new Error(
        `Media validator at ${pathToString(
          context.path,
        )} failed with an error: ${err instanceof Error ? err.message : String(err)}`,
        {cause: err},
      )
      throw error
    } finally {
      clearTimeout(slowTimer)
    }

    if (isLocalizedMessages(result)) {
      return localizeMessage(result, context.i18n)
    }

    if (typeof result === 'string') {
      return message || result
    }

    return result
  },
}
