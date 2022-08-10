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
  'fieldsets',
  'icon',
]

const SPAN_CORE = {
  name: 'span',
  title: 'Span',
  type: null,
  jsonType: 'object',
}

const MARKS_FIELD = {
  name: 'marks',
  title: 'Marks',
  type: 'array',
  of: [{type: 'string'}],
}

const TEXT_FIELD = {
  name: 'text',
  title: 'Text',
  type: 'string',
}

const DEFAULT_OPTIONS = {}

export const SpanType = {
  get() {
    return SPAN_CORE
  },
  extend(subTypeDef, extendMember) {
    const options = {...(subTypeDef.options || DEFAULT_OPTIONS)}

    const {annotations = [], marks = []} = subTypeDef

    // NOTE: if you update this please also update `SpanSchemaType` in`@sanity/types`
    const fields = [MARKS_FIELD, TEXT_FIELD]

    const parsed = Object.assign(pick(SPAN_CORE, INHERITED_FIELDS), subTypeDef, {
      type: SPAN_CORE,
      options: options,
    })

    lazyGetter(parsed, 'fields', () => {
      return fields.map((fieldDef) => {
        const {name, ...type} = fieldDef
        return {
          name: name,
          type: extendMember(type),
        }
      })
    })

    lazyGetter(parsed, 'annotations', () => annotations.map(extendMember))
    lazyGetter(parsed, 'marks', () => marks.map(extendMember))

    lazyGetter(parsed, 'preview', createPreviewGetter(subTypeDef))

    return subtype(parsed)

    function subtype(parent) {
      return {
        get() {
          return parent
        },
        extend: (extensionDef) => {
          if (extensionDef.fields) {
            throw new Error('Cannot override `fields` of subtypes of "span"')
          }
          const current = Object.assign({}, parent, pick(extensionDef, INHERITED_FIELDS), {
            type: parent,
          })
          return subtype(current)
        },
      }
    }
  },
}
