import {pick, omit} from 'lodash'

const OVERRIDABLE_FIELDS = ['jsonType', 'type', 'name', 'title', 'description', 'options', 'fieldsets']

const ANY_CORE = {
  name: 'any',
  type: null,
  jsonType: '<any>'
}

export const AnyType = {
  get() {
    return ANY_CORE
  },
  extend(subTypeDef, extendMember) {
    const parsed = Object.assign(pick(ANY_CORE, OVERRIDABLE_FIELDS), subTypeDef, {
      type: ANY_CORE,
      of: subTypeDef.of.map(extendMember)
    })

    return subtype(parsed)

    function subtype(parent) {
      return {
        get() {
          return parent
        },
        extend: extensionDef => {
          if (extensionDef.of) {
            throw new Error('Cannot override `of` property on subtypes of "any"')
          }
          const current = Object.assign({}, parent, pick(extensionDef, OVERRIDABLE_FIELDS), {type: parent})
          return subtype(current)
        }
      }
    }
  }
}
