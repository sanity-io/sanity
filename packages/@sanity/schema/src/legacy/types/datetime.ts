import {pick} from 'lodash'

import primitivePreview from '../preview/primitivePreview'
import {DEFAULT_OVERRIDEABLE_FIELDS} from './constants'

const OVERRIDABLE_FIELDS = [...DEFAULT_OVERRIDEABLE_FIELDS]

const DATETIME_CORE = {
  name: 'datetime',
  title: 'Datetime',
  type: null,
  jsonType: 'string',
}

export const DateTimeType = {
  get() {
    return DATETIME_CORE
  },
  extend(subTypeDef: any) {
    const parsed = Object.assign(pick(DATETIME_CORE, OVERRIDABLE_FIELDS), subTypeDef, {
      type: DATETIME_CORE,
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
