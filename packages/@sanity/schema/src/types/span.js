



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

const SPAN_CORE = {
  name: 'span',
  title: 'Block',
  type: null,
  styles: [],
  spans: [],
  lists: true,
  intendation: true,
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
