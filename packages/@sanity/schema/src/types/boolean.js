import {pick} from 'lodash'

const OVERRIDABLE_FIELDS = ['jsonType', 'type', 'name', 'title', 'description', 'options']

const BOOLEAN_CORE = {
  name: 'boolean',
  type: null,
  jsonType: 'boolean'
}

export const BooleanType = {
  get() {
    return BOOLEAN_CORE
  },
  extend(subTypeDef) {
    const parsed = Object.assign(pick(BOOLEAN_CORE, OVERRIDABLE_FIELDS), subTypeDef, {
      type: BOOLEAN_CORE
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
