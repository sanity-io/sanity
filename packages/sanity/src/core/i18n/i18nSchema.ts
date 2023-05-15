import {Fieldset, ObjectField, Schema, SchemaType} from '@sanity/types'
import {i18n} from 'i18next'
import {schemaI18nNamespace} from './i18nNamespaces'

/**
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
    const i18nKey = `${schemaI18nNamespace}:${path}|${property}`
    const hasTranslation = i18next.exists(i18nKey)
    return hasTranslation ? i18next.t(i18nKey) : defaultValue
  }

  function translateField(parentType: SchemaType, field: ObjectField) {
    return {
      ...field,
      get type() {
        return {
          ...field.type,
          get title() {
            return getI18nString(`${parentType.name}.${field.name}`, 'title', field.type.title)
          },
          get description() {
            return getI18nString(
              `${parentType.name}.${field.name}`,
              'description',
              field.type.description
            )
          },
        }
      },
    }
  }

  schema._registry = Object.fromEntries(
    Object.entries(schema._registry).map(([key, schemaType]) => [
      key,
      {
        ...schemaType,
        get: () => {
          const resolvedType = schemaType.get()

          const parentType = {
            ...resolvedType,
            // possibly we want to pass this down
            get title() {
              return getI18nString(resolvedType.name, 'title', resolvedType.title)
            },
            get description() {
              return getI18nString(resolvedType.name, 'description', resolvedType.description)
            },
          }

          if ('fields' in parentType) {
            return {
              ...parentType,
              get fields() {
                return parentType.fields.map((field: ObjectField) =>
                  translateField(parentType, field)
                )
              },
              get fieldsets() {
                return parentType.fieldsets.map((fieldset: Fieldset) => {
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
                      return getI18nString(parentType.name, 'title', fieldset.title)
                    },
                    get description() {
                      return getI18nString(parentType.name, 'description', fieldset.description)
                    },
                    get fields() {
                      return parentType.fields?.map((field: ObjectField) =>
                        translateField(parentType, field)
                      )
                    },
                  }
                })
              },
            }
          }
          if ('to' in parentType) {
            return {
              ...parentType,
              get to() {
                return parentType.to.map((arrayMember: SchemaType) => ({
                  ...arrayMember,
                  get title() {
                    return getI18nString(parentType.name, 'title', arrayMember.title)
                  },
                  get description() {
                    return getI18nString(parentType.name, 'description', arrayMember.description)
                  },
                }))
              },
            }
          }
          return parentType
        },
      },
    ])
  )
}
