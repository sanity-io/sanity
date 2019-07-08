import {pick, toPath, keyBy, startCase, isPlainObject} from 'lodash'
import {lazyGetter} from './utils'
import createPreviewGetter from '../preview/createPreviewGetter'
import guessOrderingConfig from '../ordering/guessOrderingConfig'
import resolveSearchConfig from '../resolveSearchConfig'

const OVERRIDABLE_FIELDS = [
  'jsonType',
  'orderings',
  'type',
  'name',
  'title',
  'readOnly',
  'hidden',
  'description',
  '__experimental_search',
  'options',
  'inputComponent',
  'validation',
  'icon'
]

const normalizeSearchConfig = configs => {
  if (!Array.isArray(configs)) {
    throw new Error(
      'The search config of a document type must be an array of search config objects'
    )
  }
  return configs.map(conf => {
    if (conf === 'defaults') {
      return conf
    }
    if (!isPlainObject(conf)) {
      throw new Error('Search config must be an object of {path: string, weight: number}')
    }
    if (typeof conf.path !== 'string') {
      throw new Error('The path property of the search field declaration must be a string')
    }
    return {
      weight: 'weight' in conf ? conf.weight : 1,
      path: toPath(conf.path)
    }
  })
}

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
          fieldset
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

    lazyGetter(
      parsed,
      '__experimental_search',
      () => {
        const userProvidedSearchConfig = subTypeDef.__experimental_search
          ? normalizeSearchConfig(subTypeDef.__experimental_search)
          : null

        if (userProvidedSearchConfig) {
          return userProvidedSearchConfig.map(entry =>
            entry === 'defaults' ? resolveSearchConfig(subTypeDef) : entry
          )
        }
        return resolveSearchConfig(parsed)
      },
      {
        enumerable: false
      }
    )

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
          lazyGetter(current, '__experimental_search', () => parent.__experimental_search)
          return subtype(current)
        }
      }
    }
  }
}

function createFieldsets(typeDef, fields) {
  const fieldsetsDef = typeDef.fieldsets || []
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
          throw new Error(
            `Group '${field.fieldset}' is not defined in schema for type '${typeDef.name}'`
          )
        }
        fieldset.fields.push(field)
        // Return the fieldset if its the first time we encounter a field in this fieldset
        return fieldset.fields.length === 1 ? fieldset : null
      }
      return {single: true, field}
    })
    .filter(Boolean)
}
