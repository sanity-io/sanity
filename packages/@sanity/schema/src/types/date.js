import {pick} from 'lodash'

const OVERRIDABLE_FIELDS = ['jsonType', 'type', 'name', 'title', 'description', 'options']

const DATE_CORE = {
  name: 'date',
  title: 'Date',
  type: null,
  jsonType: 'string'
}

export const DateType = {
  get() {
    return DATE_CORE
  },
  extend(subTypeDef) {
    const parsed = Object.assign(pick(DATE_CORE, OVERRIDABLE_FIELDS), subTypeDef, {
      type: DATE_CORE
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