import {pick} from 'lodash'

const OVERRIDABLE_FIELDS = ['jsonType', 'type', 'name', 'title', 'description', 'options']

const EMAIL_CORE = {
  name: 'email',
  title: 'Email',
  type: null,
  jsonType: 'string'
}

export const EmailType = {
  get() {
    return EMAIL_CORE
  },
  extend(subTypeDef) {
    const parsed = Object.assign(pick(EMAIL_CORE, OVERRIDABLE_FIELDS), subTypeDef, {
      type: EMAIL_CORE
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