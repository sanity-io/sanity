import {memoize} from 'lodash'
import {createInstance} from 'i18next'
import {studioLocaleStrings} from './bundles/studio'
import type {LocaleSource} from './types'
import {studioLocaleNamespace} from './localeNamespaces'
import {defaultLocale} from './locales'

const shouldEscape = typeof window === 'undefined' || typeof document === 'undefined'
const fallbackLocales: LocaleSource['locales'] = [
  {id: defaultLocale.id, title: defaultLocale.title},
]

/**
 * Returns a fallback source for internationalization that can be used in cases where you need
 * access to the "framework" of translation, but do not have access to an actual source.
 *
 * Memoized - only initializes the i18n instance once, and maintains the identity of the source.
 *
 * ⚠️ NOTE: This will only have the core studio strings defined - no custom bundles or plugins.
 *
 * @returns The fallback source
 * @internal
 */
export const getFallbackLocaleSource: () => LocaleSource = memoize(
  function getFallbackLocaleSource(): LocaleSource {
    const i18n = getFallbackI18nInstance()
    return {
      currentLocale: defaultLocale.id,
      locales: fallbackLocales,
      t: i18n.t,
    }
  },
)

function getFallbackI18nInstance() {
  return createInstance({
    ns: [studioLocaleNamespace],
    defaultNS: studioLocaleNamespace,
    initImmediate: true,
    partialBundledLanguages: true,
    fallbackLng: defaultLocale.id,
    lng: defaultLocale.id,
    supportedLngs: [defaultLocale.id],
    debug: false,
    interpolation: {
      // If we're in a browser, assume this is running inside of the studio, eg a React app,
      // and that values returned will be escaped by the framework (eg React) automatically.
      escapeValue: shouldEscape,
    },
    resources: {
      [defaultLocale.id]: {
        [studioLocaleNamespace]: studioLocaleStrings,
      },
    },
  })
}
