import {type DocumentId, getPublishedId} from '@sanity/id-utils'
import {
  type CustomValidator,
  isKeyedObject,
  isSlug,
  type Path,
  type SlugIsUniqueValidator,
  type SlugParent,
  type SlugSchemaType,
  type SlugValidationContext,
} from '@sanity/types'
import memoize from 'lodash-es/memoize.js'

import {ClientUnavailableError} from '../clientUnavailable'
import {validationMarkerCodes} from '../codes'
import {typeString} from '../util/typeString'

const DEFAULT_API_VERSION = '2025-02-19'

const memoizedWarnOnArraySlug = memoize(warnOnArraySlug)

function serializePath(path: Path): string {
  return path.reduce<string>((target, part, i) => {
    const isIndex = typeof part === 'number'
    const isKey = isKeyedObject(part)
    const separator = i === 0 ? '' : '.'
    const add = isIndex || isKey ? '[]' : `${separator}${part}`
    return `${target}${add}`
  }, '')
}

const defaultIsUnique: SlugIsUniqueValidator = (slug, context) => {
  const {getClient, document, path, type} = context
  const schemaOptions = type?.options

  if (!document) {
    throw new Error(`\`document\` was not provided in validation context.`)
  }
  if (!path) {
    throw new Error(`\`path\` was not provided in validation context.`)
  }

  const disableArrayWarning = schemaOptions?.disableArrayWarning || false
  const docType = document._type
  const atPath = serializePath(path.concat('current'))

  if (!disableArrayWarning && atPath.includes('[]') && context.environment === 'studio') {
    memoizedWarnOnArraySlug(serializePath(path))
  }

  const constraints = [
    '_type == $docType',
    `!sanity::versionOf($published)`,
    `${atPath} == $slug`,
  ].join(' && ')

  return getClient({apiVersion: DEFAULT_API_VERSION})
    .withConfig({perspective: 'raw'})
    .fetch<boolean>(
      `!defined(*[${constraints}][0]._id)`,
      {
        docType,
        published: getPublishedId(document._id as DocumentId),
        slug,
      },
      {tag: 'validation.slug-is-unique'},
    )
}

function warnOnArraySlug(serializedPath: string) {
  console.warn(
    [
      `Slug field at path ${serializedPath} is within an array and cannot be automatically checked for uniqueness`,
      `If you need to check for uniqueness, provide your own "isUnique" method`,
      `To disable this message, set \`disableArrayWarning: true\` on the slug \`options\` field`,
    ].join('\n'),
  )
}

/**
 * Validates slugs values by querying for uniqueness from the client.
 *
 * This is a custom rule implementation (e.g. `Rule.custom(slugValidator)`)
 * that's populated in `inferFromSchemaType` when the type name is `slug`
 */
export const slugValidator: CustomValidator = async (value, context) => {
  if (!value) {
    return true
  }

  const {i18n} = context

  if (typeof value !== 'object' || Array.isArray(value)) {
    return {
      code: validationMarkerCodes.slugInvalidType,
      details: {actualType: typeString(value)},
      message: i18n.t('validation:slug.not-object'),
    }
  }

  if (!isSlug(value) || value.current.trim().length === 0) {
    return {
      code: validationMarkerCodes.slugMissingCurrent,
      message: i18n.t('validation:slug.missing-current'),
    }
  }

  const options = context?.type?.options as {isUnique?: SlugIsUniqueValidator} | undefined
  const isUnique = options?.isUnique || defaultIsUnique

  if (options?.isUnique && context.__internal?.customValidation === false) {
    context.__internal.onSkipped?.({
      check: 'slugUniqueness',
      level: context.__internal?.validationLevel || 'error',
      path: context.path || [],
      reason: 'customValidationDisabled',
    })
    return true
  }

  if (!options?.isUnique && context.__internal?.hasClient === false) {
    context.__internal.onSkipped?.({
      check: 'slugUniqueness',
      level: context.__internal?.validationLevel || 'error',
      path: context.path || [],
      reason: 'clientUnavailable',
    })
    return true
  }

  const slugContext: SlugValidationContext = {
    ...context,
    parent: context.parent as SlugParent,
    type: context.type as SlugSchemaType,
    defaultIsUnique,
  }

  let wasUnique: boolean
  try {
    wasUnique = await isUnique(value.current, slugContext)
  } catch (error) {
    if (!(error instanceof ClientUnavailableError)) throw error
    context.__internal?.onSkipped?.({
      check: 'slugUniqueness',
      level: context.__internal?.validationLevel || 'error',
      path: context.path || [],
      reason: 'clientUnavailable',
    })
    return true
  }
  if (wasUnique) {
    return true
  }

  return {
    code: validationMarkerCodes.slugNotUnique,
    details: {slug: value.current},
    message: i18n.t('validation:slug.not-unique', {slug: value.current}),
  }
}
