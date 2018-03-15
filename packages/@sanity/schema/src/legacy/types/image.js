import {pick, startCase} from 'lodash'
import {lazyGetter} from './utils'
import {ASSET_FIELD, HOTSPOT_FIELD, CROP_FIELD} from './image/fieldDefs'
import createPreviewGetter from '../preview/createPreviewGetter'

const OVERRIDABLE_FIELDS = [
  'jsonType',
  'type',
  'name',
  'title',
  'description',
  'options',
  'fieldsets'
]

const IMAGE_CORE = {
  name: 'image',
  type: null,
  jsonType: 'object'
}

const DEFAULT_OPTIONS = {}

export const ImageType = {
  get() {
    return IMAGE_CORE
  },
  extend(subTypeDef, extendMember) {
    const options = {...(subTypeDef.options || DEFAULT_OPTIONS)}

    const fields = (subTypeDef.fields || [])
      .concat([options.hotspot && HOTSPOT_FIELD, options.hotspot && CROP_FIELD, ASSET_FIELD])
      .filter(Boolean)

    const parsed = Object.assign(pick(IMAGE_CORE, OVERRIDABLE_FIELDS), subTypeDef, {
      type: IMAGE_CORE,
      title: subTypeDef.title || startCase(subTypeDef.name || subTypeDef.type || ''),
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

    lazyGetter(parsed, 'preview', createPreviewGetter(Object.assign({}, subTypeDef, {fields})))

    return subtype(parsed)

    function subtype(parent) {
      return {
        get() {
          return parent
        },
        extend: extensionDef => {
          if (extensionDef.fields) {
            throw new Error('Cannot override `fields` of subtypes of "image"')
          }
          const current = Object.assign({}, parent, pick(extensionDef, OVERRIDABLE_FIELDS), {
            type: parent
          })
          return subtype(current)
        }
      }
    }
  }
}
