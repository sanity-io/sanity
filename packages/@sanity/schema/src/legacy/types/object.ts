import {castArray, flatMap, pick, startCase} from 'lodash'
import type {
  FieldGroup,
  FieldGroupDefinition,
  Fieldset,
  FieldsetDefinition,
  ObjectDefinition,
  ObjectField,
} from '@sanity/types'
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
            entry === 'defaults' ? normalizeSearchConfigs(subTypeDef) : entry,
          )
        }
        return resolveSearchConfig(parsed)
      },
      {
        enumerable: false,
      },
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

export function createFieldsets(typeDef: ObjectDefinition, fields: ObjectField[]): Fieldset[] {
  const fieldsetsByName: Record<string, FieldsetDefinition & {fields: ObjectField[]}> = {}

  for (const fieldset of typeDef.fieldsets || []) {
    if (fieldsetsByName[fieldset.name]) {
      throw new Error(
        `Duplicate fieldset name "${fieldset.name}" found for type '${
          typeDef.title ? typeDef.title : startCase(typeDef.name)
        }'`,
      )
    }

    fieldsetsByName[fieldset.name] = {title: startCase(fieldset.name), ...fieldset, fields: []}
  }

  const fieldsets = new Set<Fieldset>()

  for (const field of fields) {
    if (!field.fieldset) {
      fieldsets.add({single: true, field})
      continue
    }

    const fieldset = fieldsetsByName[field.fieldset]
    if (!fieldset) {
      throw new Error(
        `Fieldset '${field.fieldset}' is not defined in schema for type '${typeDef.name}'`,
      )
    }

    fieldset.fields.push(field)

    // The Set will prevent duplicates
    fieldsets.add(fieldset)
  }

  return Array.from(fieldsets)
}

function createFieldsGroups(typeDef: ObjectDefinition, fields: ObjectField[]): FieldGroup[] {
  const groupsByName: Record<string, FieldGroupDefinition & {fields: ObjectField[]}> = {}

  let numDefaultGroups = 0
  for (const group of typeDef.groups || []) {
    if (groupsByName[group.name]) {
      throw new Error(
        `Duplicate group name "${group.name}" found for type '${
          typeDef.title ? typeDef.title : startCase(typeDef.name)
        }'`,
      )
    }

    groupsByName[group.name] = {title: startCase(group.name), ...group, fields: []}

    if (group.default && ++numDefaultGroups > 1) {
      // Throw if you have multiple default field groups defined
      throw new Error(
        `More than one field group defined as default for type '${
          typeDef.title ? typeDef.title : startCase(typeDef.name)
        }' - only 1 is supported`,
      )
    }
  }

  fields.forEach((field) => {
    const fieldGroupNames = castArray(field.group || [])
    if (fieldGroupNames.length === 0) {
      return
    }

    fieldGroupNames.forEach((fieldGroupName) => {
      const currentGroup = groupsByName[fieldGroupName]

      if (!currentGroup) {
        throw new Error(
          `Field group '${fieldGroupName}' is not defined in schema for type '${
            typeDef.title ? typeDef.name : startCase(typeDef.name)
          }'`,
        )
      }

      currentGroup.fields.push(field)
    })
  })

  return flatMap(groupsByName).filter((group) => group.fields.length > 0)
}
