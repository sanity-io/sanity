import {pick} from 'lodash'

import {DEFAULT_OVERRIDEABLE_FIELDS, OWN_PROPS_NAME} from './constants'
import {hiddenGetter, lazyGetter} from './utils'

const OVERRIDABLE_FIELDS = [...DEFAULT_OVERRIDEABLE_FIELDS]

const ARRAY_CORE = {
  name: 'array',
  type: null,
  jsonType: 'array',
  of: [],
}

export const ArrayType = {
  get() {
    return ARRAY_CORE
  },
  extend(subTypeDef: any, createMemberType: any) {
    const parsed = Object.assign(pick(ARRAY_CORE, OVERRIDABLE_FIELDS), subTypeDef, {
      type: ARRAY_CORE,
    })
    lazyGetter(parsed, 'of', () => {
      return subTypeDef.of.map((ofTypeDef: any) => {
        return createMemberType(ofTypeDef)
      })
    })
    lazyGetter(parsed, OWN_PROPS_NAME, () => ({...subTypeDef, of: parsed.of}), {
      enumerable: false,
      writable: false,
    })

    return subtype(parsed)

    function subtype(parent: any) {
      return {
        get() {
          return parent
        },
        extend: (extensionDef: any) => {
          if (extensionDef.of) {
            throw new Error('Cannot override `of` property of subtypes of "array"')
          }
          const ownProps = pick(extensionDef, OVERRIDABLE_FIELDS)
          const current = Object.assign({}, parent, ownProps, {
            type: parent,
          })
          hiddenGetter(current, OWN_PROPS_NAME, ownProps)
          return subtype(current)
        },
      }
    }
  },
}
