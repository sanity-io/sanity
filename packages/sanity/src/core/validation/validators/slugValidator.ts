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
import {memoize} from 'lodash'

import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../studioClient'
import {getPublishedId} from '../../util/draftUtils'

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

  return getClient({apiVersion: DEFAULT_STUDIO_CLIENT_OPTIONS.apiVersion})
    .withConfig({perspective: 'raw'})
    .fetch<boolean>(
      `!defined(*[${constraints}][0]._id)`,
      {
        docType,
        published: getPublishedId(document._id),
        slug,
      },
      {tag: 'validation.slug-is-unique'},
    )
}

function warnOnArraySlug(serializedPath: string) {
  /* eslint-disable no-console */
  console.warn(
    [
      `Slug field at path ${serializedPath} is within an array and cannot be automatically checked for uniqueness`,
      `If you need to check for uniqueness, provide your own "isUnique" method`,
      `To disable this message, set \`disableArrayWarning: true\` on the slug \`options\` field`,
    ].join('\n'),
  )
  /* eslint-enable no-console */
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
    return i18n.t('validation:slug.not-object')
  }

  if (!isSlug(value) || value.current.trim().length === 0) {
    return i18n.t('validation:slug.missing-current')
  }

  const options = context?.type?.options as {isUnique?: SlugIsUniqueValidator} | undefined
  const isUnique = options?.isUnique || defaultIsUnique

  const slugContext: SlugValidationContext = {
    ...context,
    parent: context.parent as SlugParent,
    type: context.type as SlugSchemaType,
    defaultIsUnique,
  }

  const wasUnique = await isUnique(value.current, slugContext)
  if (wasUnique) {
    return true
  }

  return i18n.t('validation:slug.not-unique', {slug: value.current})
}
