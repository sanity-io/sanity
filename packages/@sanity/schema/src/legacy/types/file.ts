import {pick, startCase} from 'lodash'
import createPreviewGetter from '../preview/createPreviewGetter'
import {lazyGetter} from './utils'
import {DEFAULT_OVERRIDEABLE_FIELDS} from './constants'
import {createFieldsets} from './object'

export const ASSET_FIELD = {
  name: 'asset',
  type: 'reference',
  to: {type: 'sanity.fileAsset'},
}

const OVERRIDABLE_FIELDS = [...DEFAULT_OVERRIDEABLE_FIELDS]

const FILE_CORE = {
  name: 'file',
  title: 'File',
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
  extend(rawSubTypeDef, createMemberType) {
    const options = {...(rawSubTypeDef.options || DEFAULT_OPTIONS)}

    const fields = [ASSET_FIELD, ...(rawSubTypeDef.fields || [])]

    const subTypeDef = {...rawSubTypeDef, fields}

    const parsed = Object.assign(pick(FILE_CORE, OVERRIDABLE_FIELDS), subTypeDef, {
      type: FILE_CORE,
      title: subTypeDef.title || (subTypeDef.name ? startCase(subTypeDef.name) : ''),
      options: options,
      fields: subTypeDef.fields.map((fieldDef) => {
        const {name, fieldset, ...rest} = fieldDef

        const compiledField = {
          name,
          fieldset,
          isCustomized: Boolean(rawSubTypeDef.fields),
        }

        return lazyGetter(compiledField, 'type', () => {
          return createMemberType({
            ...rest,
            title: fieldDef.title || startCase(name),
          })
        })
      }),
    })

    lazyGetter(parsed, 'fieldsets', () => {
      return createFieldsets(subTypeDef, parsed.fields)
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
