import {Schema} from '@sanity/types'
import {i18n} from 'i18next'

/**
This function mutates the schema
 */
export function i18nSchema(schema: Schema, i18next: i18n): void {
  schema._registry = Object.fromEntries(
    Object.entries(schema._registry).map(([key, schemaType]) => [
      key,
      {
        ...schemaType,
        get: () => {
          const result = schemaType.get()
          return {
            ...result,
            // possibly we want to pass this down
            //TODO map description, fields, to and of
            get title() {
              const i18nKey = `schema:${result.name}_title`
              const hasTranslation = i18next.exists(i18nKey)
              return hasTranslation ? i18next.t(i18nKey) : result.title
            },
          }
        },
      },
    ])
  )
}
