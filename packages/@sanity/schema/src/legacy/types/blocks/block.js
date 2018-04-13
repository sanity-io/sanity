import {pick} from 'lodash'
import {lazyGetter} from '../utils'
import createPreviewGetter from '../../preview/createPreviewGetter'

import {
  BLOCK_STYLES,
  DEFAULT_BLOCK_STYLES,
  DEFAULT_LINK_ANNOTATION,
  DEFAULT_LIST_TYPES,
  DEFAULT_MARKS_FIELD,
  DEFAULT_TEXT_FIELD,
  DEFAULT_DECORATORS
} from './defaults'

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

    const {marks, styles, lists, of, ...rest} = subTypeDef

    const spansField = createSpansField(marks, of)
    const stylesField = createStylesField(styles)
    const listsField = createListsField(lists)

    const fields = [spansField, stylesField, listsField].concat(subTypeDef.fields || [])

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

    lazyGetter(parsed, 'preview', createPreviewGetter(subTypeDef))

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
          const current = Object.assign({}, parent, pick(extensionDef, INHERITED_FIELDS), {
            type: parent
          })
          return subtype(current)
        }
      }
    }
  }
}

function ensureNormalStyle(styles) {
  return styles.some(style => style.value === 'normal') ? styles : [BLOCK_STYLES.normal, ...styles]
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

const DEFAULT_ANNOTATIONS = [DEFAULT_LINK_ANNOTATION]

function createSpansField(marks, of = []) {
  return {
    name: 'children',
    title: 'Content',
    type: 'array',
    of: [
      {
        type: 'span',
        fields: [DEFAULT_TEXT_FIELD, DEFAULT_MARKS_FIELD],
        annotations: marks && marks.annotations ? marks.annotations : DEFAULT_ANNOTATIONS,
        decorators: marks && marks.decorators ? marks.decorators : DEFAULT_DECORATORS
      },
      ...of.filter(memberType => memberType.type !== 'span')
    ]
  }
}
