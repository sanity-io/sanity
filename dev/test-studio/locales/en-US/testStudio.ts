import {defineLanguageBundle} from 'sanity'

export const testStudioI18nNamespace = 'testStudio' as const

export const testStudioI18nNamespaceStrings = {
  'studio.logo.title': 'English logo',
  'structure.root.title': 'Content',
}

export default defineLanguageBundle({
  namespace: testStudioI18nNamespace,
  resources: testStudioI18nNamespaceStrings,
})
