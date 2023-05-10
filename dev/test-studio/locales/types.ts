// eslint-disable-next-line import/no-unassigned-import
import 'sanity'
import {schemaI18nNamespaceStrings} from './en-US/schema'
import {testStudioI18nNamespace, testStudioI18nNamespaceStrings} from './en-US/testStudio'

export type TestStudioTranslations = typeof testStudioI18nNamespaceStrings
export type TestStudioSchemaTranslations = typeof schemaI18nNamespaceStrings

declare module 'sanity' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface SchemaTranslations extends TestStudioSchemaTranslations {}

  interface SanityLanguageResources {
    [testStudioI18nNamespace]: TestStudioTranslations
  }
}
