import {pick, startCase} from 'lodash'

import createPreviewGetter from '../preview/createPreviewGetter'
import {DEFAULT_OVERRIDEABLE_FIELDS} from './constants'
import {createFieldsets} from './object'
import {lazyGetter} from './utils'

export const ASSET_FIELD = {
  name: 'asset',
  type: 'reference',
  to: {type: 'sanity.fileAsset'},
}

export const MEDIA_LIBRARY_ASSET_FIELD = {
  name: 'media',
  type: 'globalDocumentReference',
  hidden: true,
  to: [{type: 'sanity.asset'}],
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
  extend(rawSubTypeDef: any, createMemberType: any) {
    const options = {...(rawSubTypeDef.options || DEFAULT_OPTIONS)}

    const fields = [ASSET_FIELD, MEDIA_LIBRARY_ASSET_FIELD, ...(rawSubTypeDef.fields || [])]

    const subTypeDef = {...rawSubTypeDef, fields}

    const parsed = Object.assign(pick(FILE_CORE, OVERRIDABLE_FIELDS), subTypeDef, {
      type: FILE_CORE,
      title: subTypeDef.title || (subTypeDef.name ? startCase(subTypeDef.name) : FILE_CORE.title),
      options: options,
      fields: subTypeDef.fields.map((fieldDef: any) => {
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

    function subtype(parent: any) {
      return {
        get() {
          return parent
        },
        extend: (extensionDef: any) => {
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
