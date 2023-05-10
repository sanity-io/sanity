import {defineLanguageBundle} from 'sanity'
import {TestStudioTranslations} from '../types'
import {testStudioI18nNamespace} from '../en-US/testStudio'

export const testStudioI18nNamespaceStrings: Partial<TestStudioTranslations> = {
  'studio.logo.title': 'Norwegian logo',
  'structure.root.title': 'Innhold',
}

export default defineLanguageBundle({
  namespace: testStudioI18nNamespace,
  resources: testStudioI18nNamespaceStrings,
})
