// import the original type declarations
// eslint-disable-next-line import/no-unassigned-import
import 'i18next'
import {schemaI18nNamespace, studioI18nNamespace} from '../../i18nNamespaces'
import {type StudioTranslations} from './studio'
import {type SchemaTranslations} from './schema'

export * from './studio'

/**
 * Available for type extensions using declaration merging
 */
export interface SanityResources {
  [studioI18nNamespace]: StudioTranslations
  [schemaI18nNamespace]: SchemaTranslations
}

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof studioI18nNamespace
    resources: SanityResources
  }
}
