import {pick} from 'lodash'

const OVERRIDABLE_FIELDS = ['jsonType', 'type', 'name', 'title', 'description', 'options']

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
          const current = Object.assign({}, parent, pick(extensionDef, OVERRIDABLE_FIELDS), {type: parent})
          return subtype(current)
        }
      }
    }
  }
}
