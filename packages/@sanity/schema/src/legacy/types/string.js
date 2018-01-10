import {pick} from 'lodash'
import primitivePreview from '../preview/primitivePreview'

const OVERRIDABLE_FIELDS = ['jsonType', 'type', 'name', 'title', 'description', 'options', 'fieldsets']

const STRING_CORE = {
  name: 'string',
  type: null,
  jsonType: 'string'
}

export const StringType = {
  get() {
    return STRING_CORE
  },
  extend(subTypeDef) {
    const parsed = Object.assign(pick(STRING_CORE, OVERRIDABLE_FIELDS), subTypeDef, {
      type: STRING_CORE,
      preview: primitivePreview
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
