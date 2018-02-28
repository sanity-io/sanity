import {pick, get} from 'lodash'
import client from 'part:@sanity/base/client'

const OVERRIDABLE_FIELDS = [
  'jsonType',
  'type',
  'name',
  'title',
  'description',
  'options',
  'validation'
]

function getDocumentIds(id) {
  const isDraft = id.indexOf('drafts.') === 0
  return {
    published: isDraft ? id.slice('drafts.'.length) : id,
    draft: isDraft ? id : `drafts.${id}`
  }
}

const defaultIsUnique = (slug, options) => {
  const {document, path} = options
  const {published, draft} = getDocumentIds(document._id)
  const docType = document._type
  const atPath = path.concat('current').join('.')

  const constraints = [
    '_type == $docType',
    `!(_id in [$draft, $published])`,
    `${atPath} == $slug`
  ].join(' && ')

  return client.fetch(`!defined(*[${constraints}][0]._id)`, {docType, draft, published, slug})
}

const SLUG_CORE = {
  name: 'slug',
  title: 'Slug',
  type: null,
  jsonType: 'object',
  validation: Rule =>
    Rule.custom((value, options) => {
      if (!value) {
        return true
      }

      const errorMessage = 'Slug is already in use'
      const isUnique = get(options, 'type.options.isUnique', defaultIsUnique)
      return Promise.resolve(isUnique(value.current, {...options, defaultIsUnique})).then(
        slugIsUnique => (slugIsUnique ? true : errorMessage)
      )
    })
}

export const SlugType = {
  get() {
    return SLUG_CORE
  },
  extend(subTypeDef) {
    const parsed = Object.assign(pick(SLUG_CORE, OVERRIDABLE_FIELDS), subTypeDef, {
      type: SLUG_CORE
    })
    return subtype(parsed)

    function subtype(parent) {
      return {
        get() {
          return parent
        },
        extend: extensionDef => {
          const current = Object.assign({}, parent, pick(extensionDef, OVERRIDABLE_FIELDS), {
            type: parent
          })
          return subtype(current)
        }
      }
    }
  }
}
