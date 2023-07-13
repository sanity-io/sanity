import {defineLanguageResourceBundle} from 'sanity'

export const testStudioI18nNamespace = 'testStudio' as const

const enUSStrings = {
  'studio.logo.title': 'English logo',
  'structure.root.title': 'Content',
}

const enUS = defineLanguageResourceBundle({
  language: 'en-US',
  namespace: testStudioI18nNamespace,
  resources: enUSStrings,
})

const noNB = defineLanguageResourceBundle({
  language: 'no-NB',
  namespace: testStudioI18nNamespace,
  resources: {
    'studio.logo.title': 'Norsk logo',
    'structure.root.title': 'Innhold',
  },
})

export type I18nTestStudioResourceKeys = keyof typeof enUSStrings

export const testStudioLocaleBundles = [enUS, noNB]
