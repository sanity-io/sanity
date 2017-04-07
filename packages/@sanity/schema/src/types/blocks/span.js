import {pick} from 'lodash'
import {lazyGetter} from '../utils'
import createPreviewGetter from '../../preview/createPreviewGetter'

const INHERITED_FIELDS = [
  'type',
  'name',
  'title',
  'jsonType',
  'description',
  'options',
  'fieldsets'
]

const SPAN_CORE = {
  name: 'span',
  type: null,
  jsonType: 'object'
}

const DEFAULT_OPTIONS = {}

export const SpanType = {
  get() {
    return SPAN_CORE
  },
  extend(subTypeDef, extendMember) {
    const options = {...(subTypeDef.options || DEFAULT_OPTIONS)}

    const fields = subTypeDef.fields || []

    const parsed = Object.assign(pick(SPAN_CORE, INHERITED_FIELDS), subTypeDef, {
      type: SPAN_CORE,
      options: options
    })

    lazyGetter(parsed, 'fields', () => {
      return fields.map(fieldDef => {
        const {name, ...type} = fieldDef
        return {
          name: name,
          type: extendMember(type)
        }
      })
    })

    lazyGetter(parsed, 'preview', createPreviewGetter(subTypeDef, parsed))

    return subtype(parsed)

    function subtype(parent) {
      return {
        get() {
          return parent
        },
        extend: extensionDef => {
          if (extensionDef.fields) {
            throw new Error('Cannot override `fields` of subtypes of "span"')
          }
          const current = Object.assign({}, parent, pick(extensionDef, INHERITED_FIELDS), {type: parent})
          return subtype(current)
        }
      }
    }
  }
}
