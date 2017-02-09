



//*******************************
// DISCLAIMER: Currently disabled
//*******************************



import {pick} from 'lodash'

const OVERRIDABLE_FIELDS = [
  'jsonType',
  'type',
  'name',
  'title',
  'description',
  'style',
  'marks',
  'listItem',
  'default',
  'options'
]

const BLOCK_CORE = {
  name: 'block',
  title: 'Block',
  type: null,
  style: null,
  marks: [],
  spans: [],
  default: false,
  listItem: null,
  intendation: null,
  jsonType: 'object'
}

export const BlockType = {
  get() {
    return BLOCK_CORE
  },
  extend(subTypeDef) {
    const options = {...(subTypeDef.options || {})}
    const parsed = Object.assign(pick(BLOCK_CORE, OVERRIDABLE_FIELDS), subTypeDef, {
      type: BLOCK_CORE,
      options: options
    })
    return subtype(parsed)

    function subtype(parent) {
      return {
        get() {
          return parent
        },
        extend: extensionDef => {
          const current = Object.assign({}, parent, pick(extensionDef, OVERRIDABLE_FIELDS), {type: parent})
          return subtype(current)
        }
      }
    }
  }
}
