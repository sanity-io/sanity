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

    let hotspotFields = [HOTSPOT_FIELD, CROP_FIELD]
    if (!options.hotspot) {
      hotspotFields = hotspotFields.map(field => ({...field, hidden: true}))
    }

    const fields = (subTypeDef.fields || []).concat(ASSET_FIELD).concat(hotspotFields)

    const parsed = Object.assign(pick(IMAGE_CORE, OVERRIDABLE_FIELDS), subTypeDef, {
      type: IMAGE_CORE,
      title: subTypeDef.title || startCase(subTypeDef.name || subTypeDef.type || ''),
      options: options,
      isCustomized: Boolean(subTypeDef.fields)
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
