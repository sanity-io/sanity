import {castArray, flatMap, keyBy, pick, startCase} from 'lodash'
import createPreviewGetter from '../preview/createPreviewGetter'
import guessOrderingConfig from '../ordering/guessOrderingConfig'
import {normalizeSearchConfigs} from '../searchConfig/normalize'
import resolveSearchConfig from '../searchConfig/resolve'
import {lazyGetter} from './utils'

import {DEFAULT_OVERRIDEABLE_FIELDS} from './constants'

const OVERRIDABLE_FIELDS = [
  ...DEFAULT_OVERRIDEABLE_FIELDS,
  'orderings',
  '__experimental_search',
  'blockEditor',
  'icon',
]

export const ObjectType = {
  get() {
    return {
      name: 'object',
      title: 'Object',
      type: null,
      jsonType: 'object',
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
      fields: subTypeDef.fields.map((fieldDef) => {
        const {name, fieldset, group, ...rest} = fieldDef

        const compiledField = {
          name,
          group,
          fieldset,
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

    lazyGetter(parsed, 'groups', () => {
      return createFieldsGroups(subTypeDef, parsed.fields)
    })

    lazyGetter(parsed, 'preview', createPreviewGetter(subTypeDef))

    lazyGetter(
      parsed,
      '__experimental_search',
      () => {
        const userProvidedSearchConfig = subTypeDef.__experimental_search
          ? normalizeSearchConfigs(subTypeDef.__experimental_search)
          : null

        if (userProvidedSearchConfig) {
          return userProvidedSearchConfig.map((entry) =>
            entry === 'defaults' ? normalizeSearchConfigs(subTypeDef) : entry
          )
        }
        return resolveSearchConfig(parsed)
      },
      {
        enumerable: false,
      }
    )

    return subtype(parsed)

    function subtype(parent) {
      return {
        get() {
          return parent
        },
        extend: (extensionDef) => {
          if (extensionDef.fields) {
            throw new Error('Cannot override `fields` of subtypes of "object"')
          }
          const current = Object.assign({}, parent, pick(extensionDef, OVERRIDABLE_FIELDS), {
            title:
              extensionDef.title ||
              subTypeDef.title ||
              (subTypeDef.name ? startCase(subTypeDef.name) : ''),
            type: parent,
          })
          lazyGetter(current, '__experimental_search', () => parent.__experimental_search)
          return subtype(current)
        },
      }
    }
  },
}

export function createFieldsets(typeDef, fields) {
  const fieldsetsDef = typeDef.fieldsets || []
  const fieldsets = fieldsetsDef.map((fieldset) => {
    const {name, title, description, options, group, hidden, readOnly} = fieldset
    return {
      name,
      title,
      description,
      options,
      group,
      fields: [],
      hidden,
      readOnly,
    }
  })

  const fieldsetsByName = keyBy(fieldsets, 'name')

  return fields
    .map((field) => {
      if (field.fieldset) {
        const fieldset = fieldsetsByName[field.fieldset]
        if (!fieldset) {
          throw new Error(
            `Fieldset '${field.fieldset}' is not defined in schema for type '${typeDef.name}'`
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

function createFieldsGroups(typeDef, fields) {
  const groupsDef = typeDef.groups || []
  const groups = groupsDef.map((group) => {
    const {name, title, description, icon, readOnly, hidden} = group
    return {
      name,
      title,
      description,
      icon,
      readOnly,
      default: group.default,
      hidden,
      fields: [],
    }
  })

  const defaultGroups = groups.filter((group) => group.default)

  if (defaultGroups.length > 1) {
    // Throw if you have multiple default field groups defined
    throw new Error(
      `You currently have ${defaultGroups.length} default field groups defined for type '${
        typeDef.name ? startCase(typeDef.name) : typeDef.title ?? ``
      }', but only 1 is supported`
    )
  }

  const groupsByName = keyBy(groups, 'name')

  fields.forEach((field) => {
    if (field.group) {
      const fieldGroupNames = castArray(field.group)

      if (fieldGroupNames.length > 0) {
        fieldGroupNames.forEach((fieldGroupName) => {
          const currentGroup = groupsByName[fieldGroupName]

          if (!currentGroup) {
            throw new Error(
              `Field group '${fieldGroupName}' is not defined in schema for type '${
                typeDef.name ?? typeDef.title ?? ``
              }'`
            )
          }

          currentGroup.fields.push(field)
        })
      }
    }
  })

  return flatMap(groupsByName).filter((group) => group.fields.length > 0)
}
