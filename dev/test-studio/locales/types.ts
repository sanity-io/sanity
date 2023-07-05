// eslint-disable-next-line import/no-unassigned-import
import 'sanity'
import {testStudioI18nNamespace, testStudioI18nNamespaceStrings} from './en-US/testStudio'

export type TestStudioTranslations = typeof testStudioI18nNamespaceStrings

declare module 'sanity' {
  interface SanityLanguageResources {
    [testStudioI18nNamespace]: TestStudioTranslations
  }
}
