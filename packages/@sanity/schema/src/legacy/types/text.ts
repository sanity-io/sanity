import {pick} from 'lodash'
import primitivePreview from '../preview/primitivePreview'
import {DEFAULT_OVERRIDEABLE_FIELDS} from './constants'

const OVERRIDABLE_FIELDS = [...DEFAULT_OVERRIDEABLE_FIELDS, 'rows']

const TEXT_CORE = {
  name: 'text',
  title: 'Text',
  type: null,
  jsonType: 'string',
}

export const TextType = {
  get() {
    return TEXT_CORE
  },
  extend(subTypeDef) {
    const parsed = Object.assign(pick(TEXT_CORE, OVERRIDABLE_FIELDS), subTypeDef, {
      type: TEXT_CORE,
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
