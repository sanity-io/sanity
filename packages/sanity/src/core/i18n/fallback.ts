/* oxlint-disable @sanity/i18n/no-i18next-import */
import {createInstance, type i18n, type Resource} from 'i18next'
import memoize from 'lodash-es/memoize.js'

import {createSanityI18nBackend} from './backend'
import {isStaticResourceBundle} from './helpers'
import {studioLocaleNamespace} from './localeNamespaces'
import {defaultLocale, usEnglishLocale} from './locales'
import {type LocaleResourceBundle, type LocaleSource} from './types'

const shouldEscape = typeof window === 'undefined' || typeof document === 'undefined'
const fallbackLocales: LocaleSource['locales'] = [defaultLocale]

/**
 * Returns a fallback source for internationalization that can be used in cases where you need
 * access to the "framework" of translation, but do not have access to an actual source.
 *
 * Memoized - only initializes the i18n instance once, and maintains the identity of the source.
 *
 * ⚠️ NOTE: This will only have the base studio strings defined - no custom bundles or plugins.
 * The core bundles that load on demand (the `studio` namespace) arrive asynchronously: they are
 * requested on init, and `loadNamespaces` resolves once they are there. Until then `t` returns
 * the keys of that namespace. The statically bundled namespaces are available at once.
 *
 * @returns The fallback source
 * @internal
 * @hidden
 */
export const getFallbackLocaleSource: () => LocaleSource = memoize(
  function getFallbackLocaleSource(): LocaleSource {
    const i18n = getFallbackI18nInstance()
    return {
      currentLocale: defaultLocale,
      locales: fallbackLocales,
      loadNamespaces: i18n.loadNamespaces,
      t: i18n.t,
    }
  },
)

/**
 * Returns a memoized i18next instance with the core en-US bundles: the static ones synchronously,
 * the ones that load on demand through the same backend the studio uses.
 *
 * @internal
 * @hidden
 */
export const getFallbackI18nInstance: () => i18n = memoize(function getFallbackI18nInstance() {
  const staticResources: Resource = {[defaultLocale.id]: {}}
  const lazyBundles: LocaleResourceBundle[] = []
  const namespaces = new Set<string>()
  for (const bundle of usEnglishLocale.bundles || []) {
    if (isStaticResourceBundle(bundle)) {
      staticResources[defaultLocale.id][bundle.namespace] = bundle.resources
    } else {
      lazyBundles.push({...bundle, locale: defaultLocale.id})
    }
    namespaces.add(bundle.namespace)
  }

  const instance = createInstance({
    ns: Array.from(namespaces),
    defaultNS: studioLocaleNamespace,
    initAsync: false,
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
  }).use(createSanityI18nBackend({bundles: lazyBundles}))
  void instance.init()
  return instance
})
