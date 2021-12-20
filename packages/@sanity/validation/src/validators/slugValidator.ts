import {SlugIsUniqueValidator, Path, CustomValidator, isKeyedObject} from '@sanity/types'
import {memoize} from 'lodash'
// import getClient from '../getClient'

const memoizedWarnOnArraySlug = memoize(warnOnArraySlug)

function getDocumentIds(id: string) {
  const isDraft = id.indexOf('drafts.') === 0
  return {
    published: isDraft ? id.slice('drafts.'.length) : id,
    draft: isDraft ? id : `drafts.${id}`,
  }
}

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
  const {client, document, path, type} = context
  const schemaOptions = type?.options as {disableArrayWarning?: boolean} | undefined

  if (!document) {
    throw new Error(`\`document\` was not provided in validation context.`)
  }
  if (!path) {
    throw new Error(`\`path\` was not provided in validation context.`)
  }

  const disableArrayWarning = schemaOptions?.disableArrayWarning || false
  const {published, draft} = getDocumentIds(document._id)
  const docType = document._type
  const atPath = serializePath(path.concat('current'))

  if (!disableArrayWarning && atPath.includes('[]')) {
    memoizedWarnOnArraySlug(serializePath(path))
  }

  const constraints = [
    '_type == $docType',
    `!(_id in [$draft, $published])`,
    `${atPath} == $slug`,
  ].join(' && ')

  return client.fetch<boolean>(
    `!defined(*[${constraints}][0]._id)`,
    {
      docType,
      draft,
      published,
      slug,
    },
    {tag: 'validation.slug-is-unique'}
  )
}

function warnOnArraySlug(serializedPath: string) {
  /* eslint-disable no-console */
  console.warn(
    [
      `Slug field at path ${serializedPath} is within an array and cannot be automatically checked for uniqueness`,
      `If you need to check for uniqueness, provide your own "isUnique" method`,
      `To disable this message, set \`disableArrayWarning: true\` on the slug \`options\` field`,
    ].join('\n')
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
  if (typeof value !== 'object') {
    return 'Slug must be an object'
  }

  const slugValue = (value as {current?: string}).current
  if (!slugValue) {
    return 'Slug must have a value'
  }

  const options = context?.type?.options as {isUnique?: SlugIsUniqueValidator} | undefined
  const isUnique = options?.isUnique || defaultIsUnique

  const wasUnique = await isUnique(slugValue, {...context, defaultIsUnique})
  if (wasUnique) {
    return true
  }

  return 'Slug is already in use'
}
