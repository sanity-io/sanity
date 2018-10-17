import {pick} from 'lodash'
import {lazyGetter} from '../utils'
import createPreviewGetter from '../../preview/createPreviewGetter'

import {
  BLOCK_STYLES,
  DEFAULT_BLOCK_STYLES,
  DEFAULT_LINK_ANNOTATION,
  DEFAULT_LIST_TYPES,
  DEFAULT_DECORATORS
} from './defaults'

const INHERITED_FIELDS = [
  'type',
  'name',
  'title',
  'jsonType',
  'description',
  'options',
  'marks',
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

    const {marks, styles, lists, ...rest} = subTypeDef

    const spansField = createSpansField(marks)
    const stylesField = createStylesField(styles)
    const listsField = createListsField(lists)
    const markDefsField = createMarkDefsField(marks)

    const fields = [spansField, stylesField, listsField, markDefsField]
      .filter(Boolean)
      .concat(subTypeDef.fields || [])

    const parsed = Object.assign(pick(BLOCK_CORE, INHERITED_FIELDS), rest, {
      type: BLOCK_CORE,
      options: options,
      isCustomized: Boolean((marks && marks.annotations) || of)
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

function createDecoratorField(decorators) {
  return {
    name: 'decorators',
    type: 'array',
    title: 'Decorators',
    of: [{type: 'string'}],
    options: {
      direction: 'vertical',
      list: decorators || DEFAULT_DECORATORS
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

function createSpansField(marks) {
  return {
    name: 'spans',
    title: 'Content',
    type: 'array',
    of: [
      {
        type: 'span',
        annotations: marks && marks.annotations ? marks.annotations : DEFAULT_ANNOTATIONS,
        decorators: marks && marks.decorators ? marks.decorators : DEFAULT_DECORATORS
      }
    ]
  }
}

function createMarkDefsField(marks) {
  const annotations = (marks && marks.annotations) || DEFAULT_ANNOTATIONS
  return (
    annotations.length > 0 && {
      name: 'markDefs',
      title: 'Mark definitions',
      type: 'array',
      of: annotations
    }
  )
}
