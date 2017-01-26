import {pick} from 'lodash'

const OVERRIDABLE_FIELDS = ['jsonType', 'type', 'name', 'title', 'description', 'options', 'fieldsets']

const TEXT_CORE = {
  name: 'text',
  type: null,
  jsonType: 'string'
}

export const TextType = {
  get() {
    return TEXT_CORE
  },
  extend(subTypeDef) {
    const parsed = Object.assign(pick(TEXT_CORE, OVERRIDABLE_FIELDS), subTypeDef, {
      type: TEXT_CORE
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
