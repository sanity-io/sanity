import {pick} from 'lodash'
import {lazyGetter} from '../utils'
import createPreviewGetter from '../../preview/createPreviewGetter'

import {
  BLOCK_STYLES,
  DEFAULT_BLOCK_STYLES,
  DEFAULT_LINK_FIELD,
  DEFAULT_LIST_TYPES,
  DEFAULT_TEXT_FIELD
} from './defaults'

import {DEFAULT_MARKS} from '../../../lib/types/blocks/defaults'

const INHERITED_FIELDS = [
  'type',
  'name',
  'title',
  'jsonType',
  'description',
  'options',
  'fieldsets'
]

const BLOCK_CORE = {
  name: 'block',
  type: null,
  jsonType: 'object'
}

const DEFAULT_OPTIONS = {}

export const BlockType = {
  get() {
    return BLOCK_CORE
  },
  extend(subTypeDef, extendMember) {
    const options = {...(subTypeDef.options || DEFAULT_OPTIONS)}

    const {span, styles, lists, ...rest} = subTypeDef

    const spansField = createSpansField(span)
    const stylesField = createStylesField(styles)
    const listsField = createListsField(lists)

    const fields = [
      spansField,
      stylesField,
      listsField
    ].concat(subTypeDef.fields || [])

    const parsed = Object.assign(pick(BLOCK_CORE, INHERITED_FIELDS), rest, {
      type: BLOCK_CORE,
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
            throw new Error('Cannot override `fields` of subtypes of "block"')
          }
          const current = Object.assign({}, parent, pick(extensionDef, INHERITED_FIELDS), {type: parent})
          return subtype(current)
        }
      }
    }
  }
}

function ensureNormalStyle(styles) {
  return styles.some(style => style.value === 'normal')
    ? styles
    : [BLOCK_STYLES.normal, ...styles]
}

function createStylesField(styles) {
  return {
    name: 'style',
    title: 'Style',
    type: 'string',
    options: {
      list: ensureNormalStyle(styles || DEFAULT_BLOCK_STYLES)
    }
  }
}

function createMarksField(marks) {
  return {
    name: 'marks',
    type: 'array',
    title: 'Marks',
    of: [{type: 'string'}],
    options: {
      direction: 'vertical',
      list: marks || DEFAULT_MARKS
    }
  }
}

function createListsField(lists) {
  return {
    name: 'list',
    title: 'List type',
    type: 'string',
    options: {
      list: lists || DEFAULT_LIST_TYPES
    }
  }
}

const DEFAULT_FIELDS = [
  DEFAULT_LINK_FIELD
]

function ensureTextField(fields) {
  return fields.some(style => style.value === 'text')
    ? fields
    : [DEFAULT_TEXT_FIELD, ...fields]
}

function createSpansField(config = {}) {
  const marksField = createMarksField(config.marks)

  const fields = [
    marksField,
    ...(config.fields ? config.fields : DEFAULT_FIELDS)
  ]

  return {
    name: 'spans',
    title: 'Content',
    type: 'array',
    of: [
      {
        type: 'span',
        fields: ensureTextField(fields)
      }
    ]
  }
}
