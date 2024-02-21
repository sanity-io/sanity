import {defineLocaleResourceBundle} from 'sanity'

export const testStudioLocaleNamespace = 'testStudio' as const

const enUSStrings = {
  'structure.root.title': 'Content 🇺🇸',
  'translate.example':
    '<Icon/> Your search for "<Red>{{keyword}}</Red>" took <Bold>{{duration}}ms</Bold>',
  'translate.with-xml-in-value':
    'This value has XML in the interpolated value: <strong>{{value}}</strong>',
  'translate.with-formatter': 'This value has a list-formatter: {{countries, list}}',
  'use-translation.with-html': 'Apparently, <code>code</code> is an HTML element?',
  'use-translation.interpolation-example': 'This has {{ spaces }} around it, this one {{doesNot}}',
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
    'translate.with-xml-in-value':
      'Denne verdien har XML i en interpolert verdi: <strong>{{value}}</strong>',
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
