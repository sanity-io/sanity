import {defineLocaleResourceBundle} from 'sanity'

export const testStudioLocaleNamespace = 'testStudio' as const

const enUSStrings = {
  'studio.logo.title': 'English logo',
  'structure.root.title': 'Content',
}

const enUS = defineLocaleResourceBundle({
  locale: 'en-US',
  namespace: testStudioLocaleNamespace,
  resources: enUSStrings,
})

const noNB = defineLocaleResourceBundle({
  locale: 'no-NB',
  namespace: testStudioLocaleNamespace,
  resources: {
    'studio.logo.title': 'Norsk logo',
    'structure.root.title': 'Innhold',
  },
})

export type TestStudioLocaleResourceKeys = keyof typeof enUSStrings

export const testStudioLocaleBundles = [enUS, noNB]
