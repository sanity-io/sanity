import {pick, omit} from 'lodash'
import {DEFAULT_OVERRIDEABLE_FIELDS} from './constants'

const OVERRIDABLE_FIELDS = [...DEFAULT_OVERRIDEABLE_FIELDS]

const ANY_CORE = {
  name: 'any',
  type: null,
  jsonType: 'any',
}

export const AnyType = {
  get() {
    return ANY_CORE
  },
  extend(subTypeDef, extendMember) {
    const parsed = Object.assign(pick(ANY_CORE, OVERRIDABLE_FIELDS), subTypeDef, {
      type: ANY_CORE,
      of: subTypeDef.of.map((fieldDef) => {
        return {
          name: fieldDef.name,
          type: extendMember(omit(fieldDef, 'name')),
        }
      }),
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
