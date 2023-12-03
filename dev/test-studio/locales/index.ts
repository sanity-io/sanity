import {defineLocaleResourceBundle} from 'sanity'

export const testStudioLocaleNamespace = 'testStudio' as const

const enUSStrings = {
  'structure.root.title': 'Content 🇺🇸',
  'translate.example':
    '<Icon/> Your search for "<Red>{{keyword}}</Red>" took <Bold>{{duration}}ms</Bold>',
  'use-translation.with-html': 'Apparently, <code>code</code> is an HTML element?',
}

const enUS = defineLocaleResourceBundle({
  locale: 'en-US',
  namespace: testStudioLocaleNamespace,
  resources: enUSStrings,
})

const nbNO = defineLocaleResourceBundle({
  locale: 'nb-NO',
  namespace: testStudioLocaleNamespace,
  resources: {
    'structure.root.title': 'Innhold 🇳🇴',
    'translate.example':
      '<Icon/> Ditt søk på "<Red>{{keyword}}</Red>" tok <Bold>{{duration}}</Bold> millisekunder',
    'use-translation.with-html': 'Faktisk er <code>code</code> et HTML-element?',
  },
})

const nbNOBStructureOverrides = defineLocaleResourceBundle({
  locale: 'nb-NO',
  namespace: 'structure',
  resources: {
    'default-definition.content-title': 'Innhold 🇳🇴',
  },
})

export type TestStudioLocaleResourceKeys = keyof typeof enUSStrings

export const testStudioLocaleBundles = [enUS, nbNO, nbNOBStructureOverrides]
