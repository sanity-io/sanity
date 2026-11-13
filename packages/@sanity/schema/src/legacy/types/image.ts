import {type ImageOptions} from '@sanity/types'
import pick from 'lodash-es/pick.js'
import startCase from 'lodash-es/startCase.js'

import createPreviewGetter from '../preview/createPreviewGetter'
import {DEFAULT_OVERRIDEABLE_FIELDS, OWN_PROPS_NAME} from './constants'
import {ASSET_FIELD, CROP_FIELD, HOTSPOT_FIELD, MEDIA_LIBRARY_ASSET_FIELD} from './image/fieldDefs'
import {isHotspotEnabled, isImageToolEnabled} from './image/imageTool'
import {createFieldsets} from './object'
import {hiddenGetter, lazyGetter} from './utils'

const OVERRIDABLE_FIELDS = [...DEFAULT_OVERRIDEABLE_FIELDS]

const IMAGE_CORE = {
  name: 'image',
  title: 'Image',
  type: null,
  jsonType: 'object',
}

const DEFAULT_OPTIONS = {}

function getImageToolFields(options: ImageOptions | undefined) {
  return [
    isHotspotEnabled(options) ? HOTSPOT_FIELD : {...HOTSPOT_FIELD, hidden: true},
    isImageToolEnabled(options) ? CROP_FIELD : {...CROP_FIELD, hidden: true},
  ]
}

export const ImageType = {
  get() {
    return IMAGE_CORE
  },
  extend(rawSubTypeDef: any, createMemberType: any) {
    const options = {...(rawSubTypeDef.options || DEFAULT_OPTIONS)}

    const fields = [
      ASSET_FIELD,
      MEDIA_LIBRARY_ASSET_FIELD,
      ...getImageToolFields(options),
      ...(rawSubTypeDef.fields || []),
    ]
    const subTypeDef = {...rawSubTypeDef, fields}

    const compileField = (fieldDef: any) => {
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
    }

    const parsed = Object.assign(pick(this.get(), OVERRIDABLE_FIELDS), subTypeDef, {
      type: IMAGE_CORE,
      title: subTypeDef.title || (subTypeDef.name ? startCase(subTypeDef.name) : IMAGE_CORE.title),
      options: options,
      fields: subTypeDef.fields.map(compileField),
    })

    lazyGetter(parsed, 'fieldsets', () => {
      return createFieldsets(subTypeDef, parsed.fields)
    })

    lazyGetter(parsed, 'preview', createPreviewGetter(Object.assign({}, subTypeDef, {fields})))

    lazyGetter(
      parsed,
      OWN_PROPS_NAME,
      () => ({
        ...subTypeDef,
        options,
        fields: parsed.fields,
        title: parsed.title,
        fieldsets: parsed.fieldsets,
        preview: parsed.preview,
      }),
      {enumerable: false, writable: false},
    )

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
          const ownProps = pick(extensionDef, OVERRIDABLE_FIELDS)
          const current = Object.assign({}, parent, ownProps, {
            type: parent,
          })
          if (ownProps.options) {
            // The hotspot and crop fields follow the options in effect, which replace the parent's
            const toolFields = getImageToolFields(ownProps.options).map(compileField)
            current.fields = parent.fields.map(
              (field: any) =>
                toolFields.find((toolField) => toolField.name === field.name) ?? field,
            )
            lazyGetter(current, 'fieldsets', () => createFieldsets(subTypeDef, current.fields))
          }
          hiddenGetter(current, OWN_PROPS_NAME, ownProps)
          return subtype(current)
        },
      }
    }
  },
}
