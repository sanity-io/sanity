import {pick} from 'lodash'
import createPreviewGetter from '../preview/createPreviewGetter'
import {lazyGetter} from './utils'
import {DEFAULT_OVERRIDEABLE_FIELDS} from './constants'

export const ASSET_FIELD = {
  name: 'asset',
  type: 'reference',
  to: {type: 'sanity.fileAsset'},
}

const OVERRIDABLE_FIELDS = [...DEFAULT_OVERRIDEABLE_FIELDS]

const FILE_CORE = {
  name: 'file',
  type: null,
  jsonType: 'object',
}

const DEFAULT_OPTIONS = {
  accept: '',
}

export const FileType = {
  get() {
    return FILE_CORE
  },
  extend(subTypeDef, extendMember) {
    const options = {...(subTypeDef.options || DEFAULT_OPTIONS)}

    const fields = (subTypeDef.fields || []).concat([ASSET_FIELD]).filter(Boolean)

    const parsed = Object.assign(pick(FILE_CORE, OVERRIDABLE_FIELDS), subTypeDef, {
      type: FILE_CORE,
      options: options,
      isCustomized: Boolean(subTypeDef.fields),
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

    lazyGetter(parsed, 'preview', createPreviewGetter(Object.assign({}, subTypeDef, {fields})))

    return subtype(parsed)

    function subtype(parent) {
      return {
        get() {
          return parent
        },
        extend: (extensionDef) => {
          if (extensionDef.fields) {
            throw new Error('Cannot override `fields` of subtypes of "file"')
          }
          const current = Object.assign({}, parent, pick(extensionDef, OVERRIDABLE_FIELDS), {
            type: parent,
          })
          return subtype(current)
        },
      }
    }
  },
}
