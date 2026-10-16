import {createInstance} from 'i18next'

import {validationLocaleStrings} from './resources'
import {type LocaleSource} from './types'

let fallbackLocaleSource: LocaleSource | undefined

export function getFallbackLocaleSource(): LocaleSource {
  if (fallbackLocaleSource) return fallbackLocaleSource

  const i18n = createInstance({
    defaultNS: 'validation',
    fallbackLng: 'en-US',
    initAsync: false,
    interpolation: {escapeValue: false},
    lng: 'en-US',
    ns: ['validation'],
    resources: {'en-US': {validation: validationLocaleStrings}},
    supportedLngs: ['en-US'],
  })
  void i18n.init()

  fallbackLocaleSource = {
    currentLocale: {id: 'en-US'},
    loadNamespaces: (namespaces) => i18n.loadNamespaces(namespaces),
    t: i18n.t,
  }
  return fallbackLocaleSource
}
