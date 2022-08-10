import {pick} from 'lodash'
import primitivePreview from '../preview/primitivePreview'
import {DEFAULT_OVERRIDEABLE_FIELDS} from './constants'

const OVERRIDABLE_FIELDS = [...DEFAULT_OVERRIDEABLE_FIELDS]

const BOOLEAN_CORE = {
  name: 'boolean',
  title: 'Boolean',
  type: null,
  jsonType: 'boolean',
}

export const BooleanType = {
  get() {
    return BOOLEAN_CORE
  },
  extend(subTypeDef) {
    const parsed = Object.assign(pick(BOOLEAN_CORE, OVERRIDABLE_FIELDS), subTypeDef, {
      type: BOOLEAN_CORE,
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
