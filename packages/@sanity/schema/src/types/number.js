import {pick} from 'lodash'

const OVERRIDABLE_FIELDS = ['jsonType', 'type', 'name', 'title', 'description', 'options', 'fieldsets']

const NUMBER_CORE = {
  name: 'string',
  type: null,
  jsonType: 'string'
}

export const NumberType = {
  get() {
    return NUMBER_CORE
  },
  extend(subTypeDef) {
    const parsed = Object.assign(pick(NUMBER_CORE, OVERRIDABLE_FIELDS), subTypeDef, {
      type: NUMBER_CORE
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