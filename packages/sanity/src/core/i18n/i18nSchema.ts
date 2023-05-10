import {Fieldset, ObjectField, Schema, SchemaType} from '@sanity/types'
import {type i18n} from 'i18next'
import {schemaI18nNamespace} from './i18nNamespaces'

/**
 * @internal
 This function mutates the schema.
 Does not translate inline definitions (ie, inline nested arrays or objects)
 */
export function i18nSchema(schema: Schema, i18next: i18n): void {
  function getI18nString(path: string, property: string, defaultValue?: string) {
    if (!defaultValue) return defaultValue

    if (typeof defaultValue !== 'string') {
      // value is probably a React component, don't translate it
      return defaultValue
    }
    const i18nKey = `${schemaI18nNamespace}:${path}.${property}`
    const hasTranslation = i18next.exists(i18nKey)
    return hasTranslation ? i18next.t(i18nKey as any) : defaultValue
  }

  function translateField(parentType: SchemaType, field: ObjectField) {
    return {
      ...field,
      get type() {
        return {
          ...field.type,
          get title() {
            return getI18nString(
              `${parentType.name}.${field.name}`,
              'field-title',
              field.type.title
            )
          },
          get description() {
            return getI18nString(
              `${parentType.name}.${field.name}`,
              'field-description',
              field.type.description
            )
          },
        }
      },
    }
  }

  function withExperimentalSearch(originalType: any, newType: SchemaType): SchemaType {
    //__experimental_search is non-enumberable props
    Object.defineProperty(newType, '__experimental_search', {
      enumerable: false,
      get() {
        return originalType.__experimental_search
      },
      set(value) {
        // eslint-disable-next-line camelcase
        originalType.__experimental_search = value
      },
    })
    return newType
  }

  schema._registry = Object.fromEntries(
    Object.entries(schema._registry)?.map(([key, schemaType]) => [
      key,
      {
        ...schemaType,
        get: () => {
          const originalType = schemaType.get()
          let parentType = {
            ...originalType,
            get title() {
              return getI18nString(originalType.name, 'type-title', originalType.title)
            },
            get description() {
              return getI18nString(originalType.name, 'type-description', originalType.description)
            },
          }

          if ('groups' in parentType) {
            parentType = {
              ...parentType,
              get groups() {
                return originalType.groups?.map((group: any) => {
                  return {
                    ...group,
                    get title() {
                      return getI18nString(
                        `${parentType.name}.${group.name}`,
                        'group-title',
                        group.title
                      )
                    },
                    get description() {
                      return getI18nString(
                        `${parentType.name}.${group.name}`,
                        'group-description',
                        group.description
                      )
                    },
                  }
                })
              },
            }
          }

          if ('fields' in parentType) {
            return withExperimentalSearch(originalType, {
              ...parentType,
              get fields() {
                return parentType.fields?.map((field: ObjectField) =>
                  translateField(parentType, field)
                )
              },
              get fieldsets() {
                return parentType.fieldsets?.map((fieldset: Fieldset) => {
                  if (fieldset.single) {
                    return {
                      ...fieldset,
                      get field() {
                        return translateField(parentType, fieldset.field)
                      },
                    }
                  }
                  return {
                    ...fieldset,
                    get title() {
                      return getI18nString(
                        `${parentType.name}.${fieldset.name}`,
                        'fieldset-title',
                        fieldset.title
                      )
                    },
                    get description() {
                      return getI18nString(
                        `${parentType.name}.${fieldset.name}`,
                        'fieldset-description',
                        fieldset.description
                      )
                    },
                    get fields() {
                      return parentType.fields?.map((field: ObjectField) =>
                        translateField(parentType, field)
                      )
                    },
                  }
                })
              },
            })
          }
          if ('to' in parentType) {
            return withExperimentalSearch(originalType, {
              ...parentType,
              get to() {
                return parentType.to?.map((refType: SchemaType) => ({
                  ...refType,
                  get title() {
                    return getI18nString(
                      `${parentType.name}.${refType.name}`,
                      'ref-title',
                      refType.title
                    )
                  },
                  get description() {
                    return getI18nString(
                      `${parentType.name}.${refType.name}`,
                      'ref-description',
                      refType.description
                    )
                  },
                }))
              },
            })
          }

          if ('of' in parentType) {
            return withExperimentalSearch(originalType, {
              ...parentType,
              get of() {
                return parentType.of?.map((arrayMember: SchemaType) => ({
                  ...arrayMember,
                  get title() {
                    return getI18nString(
                      `${parentType.name}.${arrayMember.name}`,
                      'item-title',
                      arrayMember.title
                    )
                  },
                  get description() {
                    return getI18nString(
                      `${parentType.name}.${arrayMember.name}`,
                      'item-description',
                      arrayMember.description
                    )
                  },
                }))
              },
            })
          }

          return withExperimentalSearch(originalType, parentType)
        },
      },
    ])
  )
}
