import {omit, pick} from 'lodash'

import {DEFAULT_OVERRIDEABLE_FIELDS, OWN_PROPS_NAME} from './constants'
import {hiddenGetter} from './utils'

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
  extend(subTypeDef: any, extendMember: any) {
    const ownProps = {
      ...subTypeDef,
      of: subTypeDef.of.map((fieldDef: any) => {
        return {
          name: fieldDef.name,
          type: extendMember(omit(fieldDef, 'name')),
        }
      }),
    }

    const parsed = Object.assign(pick(ANY_CORE, OVERRIDABLE_FIELDS), ownProps, {
      type: ANY_CORE,
    })

    hiddenGetter(parsed, OWN_PROPS_NAME, ownProps)

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
          const subOwnProps = pick(extensionDef, OVERRIDABLE_FIELDS)
          const current = Object.assign({}, parent, subOwnProps, {
            type: parent,
          })
          hiddenGetter(current, OWN_PROPS_NAME, subOwnProps)
          return subtype(current)
        },
      }
    }
  },
}
