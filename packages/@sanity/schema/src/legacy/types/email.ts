import {pick} from 'lodash'
import primitivePreview from '../preview/primitivePreview'
import {DEFAULT_OVERRIDEABLE_FIELDS} from './constants'

const OVERRIDABLE_FIELDS = [...DEFAULT_OVERRIDEABLE_FIELDS]

const EMAIL_CORE = {
  name: 'email',
  title: 'Email',
  type: null,
  jsonType: 'string',
}

export const EmailType = {
  get() {
    return EMAIL_CORE
  },
  extend(subTypeDef) {
    const parsed = Object.assign(pick(EMAIL_CORE, OVERRIDABLE_FIELDS), subTypeDef, {
      type: EMAIL_CORE,
      preview: primitivePreview,
    })
    return subtype(parsed)

    function subtype(parent) {
      return {
        get() {
          return parent
        },
        extend: (extensionDef) => {
          const current = Object.assign({}, parent, pick(extensionDef, OVERRIDABLE_FIELDS), {
            type: parent,
          })
          return subtype(current)
        },
      }
    }
  },
}
