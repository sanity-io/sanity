import {type DocumentId, getPublishedId} from '@sanity/id-utils'
import {
  type CustomValidatorResult,
  isReference,
  isReferenceSchemaType,
  type Validators,
} from '@sanity/types'

import {validationMarkerCodes} from '../codes'
import {type InternalValidationContext} from '../types'
import {isLocalizedMessages, localizeMessage} from '../util/localizeMessage'
import {pathToString} from '../util/pathToString'
import {typeString} from '../util/typeString'
import {genericValidators, SLOW_VALIDATOR_TIMEOUT} from './genericValidator'

const metaKeys = ['_key', '_type', '_weak']

interface MediaLibraryAsset {
  currentVersion: Record<string, unknown>
  [key: string]: unknown
}

export const objectValidators: Validators = {
  ...genericValidators,

  presence: (expected, value, message, {i18n}) => {
    if (expected !== 'required') {
      return true
    }

    const keys = value && Object.keys(value).filter((key) => !metaKeys.includes(key))

    if (value === undefined || (keys && keys.length === 0)) {
      return {
        code: validationMarkerCodes.valueRequired,
        message: message || i18n.t('validation:generic.required', {context: 'object'}),
      }
    }

    return true
  },

  reference: async (_unused, value: unknown, message, context) => {
    if (!value) {
      return true
    }

    const {type, document, getDocumentExists, i18n} = context

    if (!isReference(value)) {
      return {
        code: validationMarkerCodes.referenceInvalid,
        details: {actualType: typeString(value)},
        message: message || i18n.t('validation:object.not-reference'),
      }
    }

    if (!type) {
      throw new Error(`\`type\` was not provided in validation context`)
    }

    const getDocumentType = (context as InternalValidationContext).__internal?.getDocumentType
    const weak = 'weak' in type && type.weak
    if (weak && !getDocumentType) {
      return true
    }

    if (!getDocumentExists) {
      throw new Error(`\`getDocumentExists\` was not provided in validation context`)
    }

    const selfReference = document?._id && value._ref === getPublishedId(document._id as DocumentId)
    // A self-reference needs no lookup, even if the document is not published yet.
    const exists =
      selfReference || (await getDocumentExists({id: value._ref, signal: context.signal}))
    if (!exists && !weak) {
      return {
        code: validationMarkerCodes.referenceNotPublished,
        details: {referenceId: value._ref},
        message: i18n.t('validation:object.reference-not-published', {documentId: value._ref}),
      }
    }

    if (exists && getDocumentType && isReferenceSchemaType(type)) {
      const actualType = selfReference ? document?._type : await getDocumentType(value._ref)
      if (!actualType) {
        throw new Error(`Could not read the type of referenced document "${value._ref}"`)
      }
      const allowedTypes = type.to.map((target) => target.name)
      if (!allowedTypes.includes(actualType)) {
        return {
          code: validationMarkerCodes.referenceTargetTypeMismatch,
          details: {referenceId: value._ref, actualType, allowedTypes},
          message: i18n.t('validation:object.reference-target-type-mismatch', {
            actualType,
            allowedTypes: allowedTypes.join(', '),
          }),
        }
      }
    }

    return true
  },

  assetRequired: (flag, value, message, {i18n}) => {
    if (!value || !value.asset || !value.asset._ref) {
      return {
        __internal_metadata: {
          name: 'assetRequired',
        },
        code: validationMarkerCodes.assetRequired,
        details: {assetType: flag.assetType},
        message:
          message || i18n.t('validation:object.asset-required', {context: flag.assetType || ''}),
      }
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
      return {
        code: validationMarkerCodes.mediaInvalidReference,
        message: context.i18n.t('validation:object.not-media-library-asset'),
      }
    }

    let result: CustomValidatorResult = true

    try {
      const [type, libraryId, documentId] = value.media._ref.split(':', 3)
      // TODO: replace this with stable resource config when available
      const resourceConfig = {resource: {type, id: libraryId}}
      const asset = await context
        .getClient({apiVersion: '2025-02-19'})
        .withConfig(resourceConfig)
        .fetch<MediaLibraryAsset | null>(
          `*[_id == $id] { ..., 'currentVersion': @.currentVersion-> { ... }  }[0]`,
          {
            id: documentId,
          },
          {signal: context.signal},
        )
      if (!asset) {
        console.warn(
          `${context.i18n.t('validation:object.media-not-found')}\nAsset ID: ${value.media._ref}`,
        )
        return {
          code: validationMarkerCodes.mediaNotFound,
          details: {referenceId: value.media._ref},
          message: context.i18n.t('validation:object.media-not-found'),
        }
      }

      result = await fn(
        {
          media: {
            asset: asset as unknown as Parameters<typeof fn>[0]['media']['asset'],
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

    const validationErrorMetadata = {
      __internal_metadata: {
        name: 'media',
      },
    }

    // Valid, no errors
    if (result === true) {
      return result
    }

    // Ensure we always return ValidationMarker with metadata
    return Array.isArray(result)
      ? result
      : [result].map((res) => {
          if (typeof res === 'string') {
            return {...validationErrorMetadata, message: message || res}
          }
          if (isLocalizedMessages(res)) {
            return {
              ...validationErrorMetadata,
              message: message || localizeMessage(res, context.i18n),
            }
          }
          return {...validationErrorMetadata, ...res, message: message || res.message}
        })
  },
}
