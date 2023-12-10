import {memoize} from 'lodash'
import {type Resource, createInstance} from 'i18next'
import type {LocaleSource} from './types'
import {studioLocaleNamespace} from './localeNamespaces'
import {defaultLocale, usEnglishLocale} from './locales'
import {isStaticResourceBundle} from './helpers'

const shouldEscape = typeof window === 'undefined' || typeof document === 'undefined'
const fallbackLocales: LocaleSource['locales'] = [defaultLocale]

/**
 * Returns a fallback source for internationalization that can be used in cases where you need
 * access to the "framework" of translation, but do not have access to an actual source.
 *
 * Memoized - only initializes the i18n instance once, and maintains the identity of the source.
 *
 * ⚠️ NOTE: This will only have the base studio strings defined - no custom bundles or plugins.
 *
 * @returns The fallback source
 * @internal
 */
export const getFallbackLocaleSource: () => LocaleSource = memoize(
  function getFallbackLocaleSource(): LocaleSource {
    const i18n = getFallbackI18nInstance()
    i18n.init()
    return {
      currentLocale: defaultLocale,
      locales: fallbackLocales,
      loadNamespaces: i18n.loadNamespaces,
      t: i18n.t,
    }
  },
)

function getFallbackI18nInstance() {
  // Find all core locale resource bundles we can load synchronously
  const staticResources: Resource = {[defaultLocale.id]: {}}
  const staticBundles = usEnglishLocale.bundles?.filter(isStaticResourceBundle) || []
  const namespaces = new Set<string>()
  for (const bundle of staticBundles) {
    staticResources[defaultLocale.id][bundle.namespace] = bundle.resources
    namespaces.add(bundle.namespace)
  }

  return createInstance({
    ns: Array.from(namespaces),
    defaultNS: studioLocaleNamespace,
    initImmediate: true,
    partialBundledLanguages: true,
    fallbackLng: defaultLocale.id,
    lng: defaultLocale.id,
    supportedLngs: [defaultLocale.id],
    debug: false,
    load: 'currentOnly',
    resources: staticResources,
    interpolation: {
      // If we're in a browser, assume this is running inside of the studio, eg a React app,
      // and that values returned will be escaped by the framework (eg React) automatically.
      escapeValue: shouldEscape,
    },
  })
}
