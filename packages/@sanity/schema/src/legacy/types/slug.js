import {pick} from 'lodash'
import {lazyGetter} from './utils'

const OVERRIDABLE_FIELDS = ['jsonType', 'type', 'name', 'title', 'description', 'options']

export const CURRENT_FIELD = {
  name: 'current',
  title: 'Current slug',
  type: 'string'
}

const SLUG_FIELDS = [CURRENT_FIELD]

const SLUG_CORE = {
  name: 'slug',
  title: 'Slug',
  type: null,
  jsonType: 'object'
}

export const SlugType = {
  get() {
    return SLUG_CORE
  },
  extend(subTypeDef, extendMember) {
    const parsed = Object.assign(pick(SLUG_CORE, OVERRIDABLE_FIELDS), subTypeDef, {
      type: SLUG_CORE,
      preview: {
        select: {title: 'current'}
      }
    })

    lazyGetter(parsed, 'fields', () => {
      return SLUG_FIELDS.map(fieldDef => {
        const {name, ...type} = fieldDef
        return {
          name: name,
          type: extendMember(type)
        }
      })
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
