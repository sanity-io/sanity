import {pick} from 'lodash'

import createPreviewGetter from '../../preview/createPreviewGetter'
import {OWN_PROPS_NAME} from '../constants'
import {hiddenGetter, lazyGetter} from '../utils'

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
  extend(subTypeDef: any, extendMember: any) {
    const options = {...(subTypeDef.options || DEFAULT_OPTIONS)}

    const {annotations = [], marks = []} = subTypeDef

    // NOTE: if you update this please also update `SpanSchemaType` in`@sanity/types`
    const fields = [MARKS_FIELD, TEXT_FIELD]

    const ownProps = {...subTypeDef, options}

    const parsed = Object.assign(pick(SPAN_CORE, INHERITED_FIELDS), ownProps, {
      type: SPAN_CORE,
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

    lazyGetter(
      parsed,
      OWN_PROPS_NAME,
      () => ({
        ...ownProps,
        fields: parsed.fields,
        annotations: parsed.annotations,
        marks: parsed.marks,
        preview: parsed.preview,
      }),
      {enumerable: false, writable: false},
    )

    return subtype(parsed)

    function subtype(parent: any) {
      return {
        get() {
          return parent
        },
        extend: (extensionDef: any) => {
          if (extensionDef.fields) {
            throw new Error('Cannot override `fields` of subtypes of "span"')
          }
          const subOwnProps = pick(extensionDef, INHERITED_FIELDS)
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
