import {defineLocaleResourceBundle} from 'sanity'

export const testStudioLocaleNamespace = 'testStudio' as const

const enUSStrings = {
  'studio.logo.title': 'English logo',
  'structure.root.title': 'Content 🇺🇸',
  'translate.example':
    '<Icon/> Your search for "<Red>{{keyword}}</Red>" took <Bold>{{duration}}ms</Bold>',
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
    'structure.root.title': 'Innhold 🇳🇴',
    'translate.example':
      '<Icon/> Ditt søk på "<Red>{{keyword}}</Red>" tok <Bold>{{duration}}</Bold> millisekunder',
  },
})

export type TestStudioLocaleResourceKeys = keyof typeof enUSStrings

export const testStudioLocaleBundles = [enUS, noNB]
