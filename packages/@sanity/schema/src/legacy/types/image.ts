import {pick, startCase} from 'lodash'

import createPreviewGetter from '../preview/createPreviewGetter'
import {DEFAULT_OVERRIDEABLE_FIELDS} from './constants'
import {ASSET_FIELD, CROP_FIELD, HOTSPOT_FIELD} from './image/fieldDefs'
import {createFieldsets} from './object'
import {lazyGetter} from './utils'

const OVERRIDABLE_FIELDS = [...DEFAULT_OVERRIDEABLE_FIELDS]

const IMAGE_CORE = {
  name: 'image',
  title: 'Image',
  type: null,
  jsonType: 'object',
}

const DEFAULT_OPTIONS = {}

export const ImageType = {
  get() {
    return IMAGE_CORE
  },
  extend(rawSubTypeDef: any, createMemberType: any) {
    const options = {...(rawSubTypeDef.options || DEFAULT_OPTIONS)}

    let hotspotFields = [HOTSPOT_FIELD, CROP_FIELD]
    if (!options.hotspot) {
      hotspotFields = hotspotFields.map((field) => ({...field, hidden: true}))
    }

    const fields = [ASSET_FIELD, ...hotspotFields, ...(rawSubTypeDef.fields || [])]
    const subTypeDef = {...rawSubTypeDef, fields}

    const parsed = Object.assign(pick(this.get(), OVERRIDABLE_FIELDS), subTypeDef, {
      type: IMAGE_CORE,
      title: subTypeDef.title || (subTypeDef.name ? startCase(subTypeDef.name) : IMAGE_CORE.title),
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
            throw new Error('Cannot override `fields` of subtypes of "image"')
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
