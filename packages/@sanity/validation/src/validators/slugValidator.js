const {get, memoize} = require('lodash')
const getClient = require('../getClient')

const memoizedWarnOnArraySlug = memoize(warnOnArraySlug)

function getDocumentIds(id) {
  const isDraft = id.indexOf('drafts.') === 0
  return {
    published: isDraft ? id.slice('drafts.'.length) : id,
    draft: isDraft ? id : `drafts.${id}`,
  }
}

function serializePath(path) {
  return path.reduce((target, part, i) => {
    const isIndex = typeof part === 'number'
    const isKey = part && part._key
    const separator = i === 0 ? '' : '.'
    const add = isIndex || isKey ? '[]' : `${separator}${part}`
    return `${target}${add}`
  }, '')
}

const defaultIsUnique = (slug, options) => {
  const {document, path, type} = options
  const {disableArrayWarning} = type.options
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

  return getClient().fetch(
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

function warnOnArraySlug(path) {
  /* eslint-disable no-console */
  console.warn(
    [
      `Slug field at path ${path} is within an array and cannot be automatically checked for uniqueness`,
      `If you need to check for uniqueness, provide your own "isUnique" method`,
      `To disable this message, set \`disableArrayWarning: true\` on the slug \`options\` field`,
    ].join('\n')
  )
  /* eslint-enable no-console */
}

export const slugValidator = (value, options) => {
  if (!value) {
    return true
  }

  if (!value.current) {
    return 'Slug must have a value'
  }

  const errorMessage = 'Slug is already in use'
  const isUnique = get(options, 'type.options.isUnique', defaultIsUnique)
  return Promise.resolve(
    isUnique(value.current, {...options, defaultIsUnique})
  ).then((slugIsUnique) => (slugIsUnique ? true : errorMessage))
}
