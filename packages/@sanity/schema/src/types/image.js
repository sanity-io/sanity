import {pick, omit} from 'lodash'
import {lazyGetter} from './utils'
import guessPreviewConfig from '../preview/guessPreviewConfig'

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
  type: 'object',
  jsonType: 'object',
  fields: [
    {
      name: 'asset',
      type: 'reference',
      to: [{type: 'imageAsset'}]
    }
  ]
}

export const HOTSPOT_FIELD = {
  name: 'hotspot',
  type: 'object',
  fields: [
    {
      name: 'x',
      type: 'number'
    },
    {
      name: 'y',
      type: 'number'
    },
    {
      name: 'height',
      type: 'number'
    },
    {
      name: 'width',
      type: 'number'
    }
  ]
}

export const CROP_FIELD = {
  name: 'crop',
  type: 'object',
  fields: [
    {
      name: 'top',
      type: 'number'
    },
    {
      name: 'bottom',
      type: 'number'
    },
    {
      name: 'left',
      type: 'number'
    },
    {
      name: 'right',
      type: 'number'
    }
  ]
}

export const ImageType = {
  get() {
    return IMAGE_CORE
  },
  extend(subTypeDef, extendMember) {
    const options = {...(subTypeDef.options || {})}
    const parsed = Object.assign(pick(IMAGE_CORE, OVERRIDABLE_FIELDS), subTypeDef, {
      type: IMAGE_CORE,
      options: options,
      fields: IMAGE_CORE.fields.concat(subTypeDef.fields || []).map(fieldDef => {
        return {
          name: fieldDef.name,
          type: extendMember(omit(fieldDef, 'name'))
        }
      })
    })

    lazyGetter(options, 'preview', () => {
      return (subTypeDef.options || {}).preview || guessPreviewConfig(parsed.fields)
    })

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
          const current = Object.assign({}, parent, pick(extensionDef, OVERRIDABLE_FIELDS), {type: parent})
          return subtype(current)
        }
      }
    }
  }
}