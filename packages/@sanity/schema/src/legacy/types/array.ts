import {pick} from 'lodash'
import {lazyGetter} from './utils'
import {DEFAULT_OVERRIDEABLE_FIELDS} from './constants'

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
  extend(subTypeDef, createMemberType) {
    const parsed = Object.assign(pick(ARRAY_CORE, OVERRIDABLE_FIELDS), subTypeDef, {
      type: ARRAY_CORE,
    })
    lazyGetter(parsed, 'of', () => {
      return subTypeDef.of.map((ofTypeDef) => {
        return createMemberType(ofTypeDef)
      })
    })

    return subtype(parsed)

    function subtype(parent) {
      return {
        get() {
          return parent
        },
        extend: (extensionDef) => {
          if (extensionDef.of) {
            throw new Error('Cannot override `of` property of subtypes of "array"')
          }
          const current = Object.assign({}, parent, pick(extensionDef, OVERRIDABLE_FIELDS), {
            type: parent,
          })
          return subtype(current)
        },
      }
    }
  },
}
