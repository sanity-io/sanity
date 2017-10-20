import {pick, keyBy, startCase} from 'lodash'
import {lazyGetter} from './utils'
import createPreviewGetter from '../preview/createPreviewGetter'
import guessOrderingConfig from '../ordering/guessOrderingConfig'

const OVERRIDABLE_FIELDS = [
  'jsonType',
  'orderings',
  'type',
  'name',
  'title',
  'readOnly',
  'hidden',
  'description',
  'options',
  'inputComponent'
]

export const ObjectType = {
  get() {
    return {
      name: 'object',
      type: null,
      jsonType: 'object'
    }
  },
  extend(rawSubTypeDef, createMemberType) {

    const subTypeDef = {fields: [], ...rawSubTypeDef}

    const options = {...(subTypeDef.options || {})}
    const parsed = Object.assign(pick(this.get(), OVERRIDABLE_FIELDS), subTypeDef, {
      type: this.get(),
      title: subTypeDef.title || (subTypeDef.name ? startCase(subTypeDef.name) : ''),
      options: options,
      orderings: subTypeDef.orderings || guessOrderingConfig(subTypeDef),
      fields: subTypeDef.fields.map(fieldDef => {
        const {name, fieldset, ...rest} = fieldDef

        const compiledField = {
          name,
          fieldset,
        }

        return lazyGetter(compiledField, 'type', () => {
          return createMemberType({
            ...rest,
            title: fieldDef.title || startCase(name)
          })
        })
      })
    })

    lazyGetter(parsed, 'fieldsets', () => {
      return createFieldsets(subTypeDef, parsed.fields)
    })

    lazyGetter(parsed, 'preview', createPreviewGetter(subTypeDef))

    return subtype(parsed)

    function subtype(parent) {
      return {
        get() {
          return parent
        },
        extend: extensionDef => {
          if (extensionDef.fields) {
            throw new Error('Cannot override `fields` of subtypes of "object"')
          }
          const current = Object.assign({}, parent, pick(extensionDef, OVERRIDABLE_FIELDS), {
            title: extensionDef.title || subTypeDef.title,
            type: parent
          })
          return subtype(current)
        }
      }
    }
  }
}


function createFieldsets(typeDef, fields) {
  const fieldsetsDef = (typeDef.fieldsets || [])
  const fieldsets = fieldsetsDef.map(fieldset => {
    const {name, title, description, options} = fieldset
    return {
      name,
      title,
      description,
      options,
      fields: []
    }
  })

  const fieldsetsByName = keyBy(fieldsets, 'name')

  return fields
    .map(field => {
      if (field.fieldset) {
        const fieldset = fieldsetsByName[field.fieldset]
        if (!fieldset) {
          throw new Error(`Group '${field.fieldset}' is not defined in schema for type '${typeDef.name}'`)
        }
        fieldset.fields.push(field)
        // Return the fieldset if its the first time we encounter a field in this fieldset
        return fieldset.fields.length === 1 ? fieldset : null
      }
      return {single: true, field}
    })
    .filter(Boolean)
}
