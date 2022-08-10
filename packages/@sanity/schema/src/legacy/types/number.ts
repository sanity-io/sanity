import {pick} from 'lodash'
import primitivePreview from '../preview/primitivePreview'
import {DEFAULT_OVERRIDEABLE_FIELDS} from './constants'

const OVERRIDABLE_FIELDS = [...DEFAULT_OVERRIDEABLE_FIELDS]

const NUMBER_CORE = {
  name: 'number',
  title: 'Number',
  type: null,
  jsonType: 'number',
}

export const NumberType = {
  get() {
    return NUMBER_CORE
  },
  extend(subTypeDef) {
    const parsed = Object.assign(pick(NUMBER_CORE, OVERRIDABLE_FIELDS), subTypeDef, {
      type: NUMBER_CORE,
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
