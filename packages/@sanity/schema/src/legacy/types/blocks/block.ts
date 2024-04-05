import {pick} from 'lodash'

import createPreviewGetter from '../../preview/createPreviewGetter'
import {lazyGetter} from '../utils'
import {
  BLOCK_STYLES,
  DEFAULT_BLOCK_STYLES,
  DEFAULT_DECORATORS,
  DEFAULT_LINK_ANNOTATION,
  DEFAULT_LIST_TYPES,
  DEFAULT_MARKS_FIELD,
  DEFAULT_TEXT_FIELD,
} from './defaults'

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

const BLOCK_CORE = {
  name: 'block',
  title: 'Block',
  type: null,
  jsonType: 'object',
}

const DEFAULT_OPTIONS = {}

export const BlockType = {
  get() {
    return BLOCK_CORE
  },
  extend(subTypeDef: any, extendMember: any) {
    const options = {...(subTypeDef.options || DEFAULT_OPTIONS)}

    const {marks, styles, lists, of, ...rest} = subTypeDef

    const childrenField = createChildrenField(marks, of)
    const styleField = createStyleField(styles)
    const listItemField = createListItemField(lists)

    const markDefsField = {
      name: 'markDefs',
      title: 'Mark definitions',
      type: 'array',
      of: marks?.annotations || DEFAULT_ANNOTATIONS,
    }

    const levelField = {
      name: 'level',
      title: 'Indentation',
      type: 'number',
    }

    // NOTE: if you update this (EVEN THE ORDER OF FIELDS) you _NEED TO_ also
    // update `BlockSchemaType`, `isBlockSchemaType` and similar in `@sanity/types`
    const fields = [childrenField, styleField, listItemField, markDefsField, levelField].concat(
      subTypeDef.fields || [],
    )

    const parsed = Object.assign(pick(BLOCK_CORE, INHERITED_FIELDS), rest, {
      type: BLOCK_CORE,
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

    lazyGetter(parsed, 'preview', createPreviewGetter(subTypeDef))

    return subtype(parsed)

    function subtype(parent: any) {
      return {
        get() {
          return parent
        },
        extend: (extensionDef: any) => {
          if (extensionDef.fields) {
            throw new Error('Cannot override `fields` of subtypes of "block"')
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

function ensureNormalStyle(styles: any) {
  return styles.some((style: any) => style.value === 'normal')
    ? styles
    : [BLOCK_STYLES.normal, ...styles]
}

function createStyleField(styles: any) {
  return {
    name: 'style',
    title: 'Style',
    type: 'string',
    options: {
      list: ensureNormalStyle(styles || DEFAULT_BLOCK_STYLES),
    },
  }
}

function createListItemField(lists: any) {
  return {
    name: 'listItem',
    title: 'List type',
    type: 'string',
    options: {
      list: lists || DEFAULT_LIST_TYPES,
    },
  }
}

const DEFAULT_ANNOTATIONS = [DEFAULT_LINK_ANNOTATION]

function createChildrenField(marks: any, of = []) {
  return {
    name: 'children',
    title: 'Content',
    type: 'array',
    of: [
      {
        type: 'span',
        fields: [DEFAULT_TEXT_FIELD, DEFAULT_MARKS_FIELD],
        annotations: marks && marks.annotations ? marks.annotations : DEFAULT_ANNOTATIONS,
        decorators: marks && marks.decorators ? marks.decorators : DEFAULT_DECORATORS,
      },
      ...of.filter((memberType: any) => memberType.type !== 'span'),
    ],
  }
}
