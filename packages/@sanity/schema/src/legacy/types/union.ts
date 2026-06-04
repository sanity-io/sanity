import pick from 'lodash-es/pick.js'

import {DEFAULT_OVERRIDEABLE_FIELDS, OWN_PROPS_NAME} from './constants'
import {hiddenGetter, lazyGetter} from './utils'

const OVERRIDABLE_FIELDS = [...DEFAULT_OVERRIDEABLE_FIELDS, 'of']

const UNION_CORE = {
  name: 'union',
  type: null,
  jsonType: 'object',
  unionKind: 'object',
  of: [],
  __experimental_union: true,
}

export const UnionType = {
  get() {
    return UNION_CORE
  },
  extend(subTypeDef: any, createMemberType: any) {
    const parsed = Object.assign(pick(UNION_CORE, OVERRIDABLE_FIELDS), subTypeDef, {
      type: UNION_CORE,
      jsonType: 'object',
      unionKind: 'object',
      __experimental_union: true,
    })

    lazyGetter(parsed, 'of', () => {
      return subTypeDef.of.map((ofTypeDef: any) => createMemberType.cached(ofTypeDef))
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
            throw new Error('Cannot override `of` property of subtypes of "union"')
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
