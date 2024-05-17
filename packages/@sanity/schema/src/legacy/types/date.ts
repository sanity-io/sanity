import {pick} from 'lodash'

import primitivePreview from '../preview/primitivePreview'
import {DEFAULT_OVERRIDEABLE_FIELDS} from './constants'

const OVERRIDABLE_FIELDS = [...DEFAULT_OVERRIDEABLE_FIELDS]

const DATE_CORE = {
  name: 'date',
  title: 'Datetime',
  type: null,
  jsonType: 'string',
}

export const DateType = {
  get() {
    return DATE_CORE
  },
  extend(subTypeDef: any) {
    const parsed = Object.assign(pick(DATE_CORE, OVERRIDABLE_FIELDS), subTypeDef, {
      type: DATE_CORE,
      preview: primitivePreview,
    })
    return subtype(parsed)

    function subtype(parent: any) {
      return {
        get() {
          return parent
        },
        extend: (extensionDef: any) => {
          const current = Object.assign({}, parent, pick(extensionDef, OVERRIDABLE_FIELDS), {
            type: parent,
          })
          return subtype(current)
        },
      }
    }
  },
}
