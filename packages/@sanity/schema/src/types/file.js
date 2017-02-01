import {pick} from 'lodash'
import {lazyGetter} from './utils'
import guessPreviewConfig from '../preview/guessPreviewConfig'

export const ASSET_FIELD = {
  name: 'asset',
  type: 'reference',
  to: {type: 'fileAsset'}
}

const OVERRIDABLE_FIELDS = [
  'jsonType',
  'type',
  'name',
  'title',
  'description',
  'options',
  'fieldsets'
]

const FILE_CORE = {
  name: 'file',
  type: null,
  jsonType: 'object'
}

const DEFAULT_OPTIONS = {}

export const FileType = {
  get() {
    return FILE_CORE
  },
  extend(subTypeDef, extendMember) {
    const options = {...(subTypeDef.options || DEFAULT_OPTIONS)}

    const fields = (subTypeDef.fields || []).concat([
      ASSET_FIELD
    ])
      .filter(Boolean)

    const parsed = Object.assign(pick(FILE_CORE, OVERRIDABLE_FIELDS), subTypeDef, {
      type: FILE_CORE,
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

    lazyGetter(parsed, 'preview', () => {
      return (subTypeDef.preview || (subTypeDef.options || {}).preview) || guessPreviewConfig(parsed.fields)
    })

    return subtype(parsed)

    function subtype(parent) {
      return {
        get() {
          return parent
        },
        extend: extensionDef => {
          if (extensionDef.fields) {
            throw new Error('Cannot override `fields` of subtypes of "file"')
          }
          const current = Object.assign({}, parent, pick(extensionDef, OVERRIDABLE_FIELDS), {type: parent})
          return subtype(current)
        }
      }
    }
  }
}