import {createInstance as createI18nInstance, type InitOptions, type i18n} from 'i18next'
import {initReactI18next} from 'react-i18next'
import type {SourceOptions} from '../config'
import {resolveConfigProperty} from '../config/resolveConfigProperty'
import {
  localeBundlesReducer,
  localeDefReducer,
  preferredLocalesReducer,
} from '../config/configPropertyReducers'
import {defaultLocale} from './locales'
import {createSanityI18nBackend} from './backend'
import type {LocaleSource, LocaleDefinition, LocaleResourceBundle, Locale} from './types'
import {studioLocaleNamespace} from './localeNamespaces'
import {getStoredLocale} from './localeStore'
import {DEBUG_I18N, maybeWrapT} from './debug'

/**
 * @internal
 * @hidden
 */
export function prepareI18n(source: SourceOptions): {source: LocaleSource; i18next: i18n} {
  const {projectId, dataset, name: sourceName} = source
  const context = {projectId: projectId, dataset}

  const locales = resolveConfigProperty({
    config: source,
    context,
    propertyName: 'i18n.locales',
    reducer: localeDefReducer,
    initialValue: [defaultLocale],
  })

  const bundles = resolveConfigProperty({
    config: source,
    context,
    propertyName: 'i18n.bundles',
    reducer: localeBundlesReducer,
    initialValue: normalizeResourceBundles(locales),
  })

  const preferredLocales = resolveConfigProperty({
    config: source,
    context,
    propertyName: 'i18n.preferredLocales',
    reducer: preferredLocalesReducer,
    initialValue: Array.from(
      new Set<string>(
        typeof navigator === 'object' && Array.isArray(navigator.languages)
          ? [...navigator.languages, defaultLocale.id]
          : [defaultLocale.id],
      ),
    ),
  })

  const preferredLocale = resolvePreferredLocale(preferredLocales, locales)

  return createI18nApi({
    locales,
    bundles,
    projectId,
    sourceName,
    preferredLocale,
  })
}

/**
 * Preferred locales can come from both the user and from the browser.
 *
 * If the browser is configured to allow "English (US), Norwegian, Portugese, Portugese (Brazil)",
 * it will report `["en-US", "no", "pt", "pt-BR"]` as the preferred locales. The locale definitions
 * wants the full locale ID however, eg `nb-NO`, `pt-PT` etc. Thus, we'll need to try to normalize
 * these values. Complication; some languages are "subtags": `nb` is a subtag, where `no` is the
 * "macro language" (see https://datatracker.ietf.org/doc/html/rfc5646#section-3.1.10). We'll need
 * to also resolve based on that.
 *
 * @param preferredLocales - The preferred locales to resolve
 * @param locales - The locales to resolve against
 * @returns The resolved preferred locale, falling back to the default (`en-US`) if not found
 */
function resolvePreferredLocale(preferredLocales: string[], locales: LocaleDefinition[]): string {
  // Create a map of all the defined locales that have a macro language, eg `no` => `nb-NO`, `nn-NO`
  const localeIds = new Set<string>()
  const macroLanguageMap = new Map<string, string[]>()
  for (const locale of locales) {
    localeIds.add(locale.id)

    if (!locale.macroLanguage) {
      continue
    }

    const map = macroLanguageMap.get(locale.macroLanguage.toLowerCase()) || []
    macroLanguageMap.set(locale.macroLanguage.toLowerCase(), [...map, locale.id])
  }

  // All the locale bundles use a full `en-US` style locale ID, so we'll need to normalize the
  // passed preferred locales to match. We'll also need to handle macro languages, eg `nb` vs `no`.
  for (const locale of preferredLocales) {
    const lower = locale.toLowerCase()
    const [lang, region] = lower.split('-')

    // Direct (normalized) match, eg `en-US` => `en-US` or `nb-no` => `nb-NO
    if (region) {
      const normalized = `${lang}-${region.toUpperCase()}`
      if (localeIds.has(normalized)) {
        return normalized
      }
    }

    // Language => region match, eg `pt` => `pt-PT`
    const langRegion = `${lang}-${lang.toUpperCase()}`
    if (localeIds.has(langRegion)) {
      return langRegion
    }

    // Macro-language map, eg `no` => `nb-NO`, `nn-NO`
    for (const macroMapped of macroLanguageMap.get(lang) || []) {
      if (localeIds.has(macroMapped)) {
        return macroMapped
      }
    }

    // No match, try the next one
  }

  // Fall back to the first defined locale, or the default locale if none found
  return locales[0]?.id ?? defaultLocale.id
}

function createI18nApi({
  locales,
  bundles,
  projectId,
  sourceName,
  preferredLocale,
}: {
  locales: LocaleDefinition[]
  bundles: LocaleResourceBundle[]
  projectId: string
  sourceName: string
  preferredLocale: string
}): {source: LocaleSource; i18next: i18n} {
  const options = getI18NextOptions(projectId, sourceName, locales, preferredLocale)
  const i18nInstance = createI18nInstance()
    .use(createSanityI18nBackend({bundles}))
    .use(initReactI18next)

  i18nInstance.init(options).catch((err) => {
    console.error('Failed to initialize i18n backend: %s', err)
  })

  const reducedLocales = locales.map(reduceLocaleDefinition)

  return {
    /** @public */
    source: {
      get currentLocale() {
        return reducedLocales.find((locale) => locale.id === i18nInstance.language) ?? defaultLocale
      },
      loadNamespaces(namespaces: string[]): Promise<void> {
        const missing = namespaces.filter((ns) => !i18nInstance.hasLoadedNamespace(ns))
        return missing.length === 0 ? Promise.resolve() : i18nInstance.loadNamespaces(missing)
      },
      locales: reducedLocales,
      t: maybeWrapT(i18nInstance.t),
    },

    /** @internal */
    i18next: i18nInstance,
  }
}

/**
 * Takes the locales config and returns a normalized array of bundles from the defined locales.
 *
 * @param locales - The locale bundles defined in configuration/plugins
 * @returns An array of normalized bundles
 * @internal
 */
function normalizeResourceBundles(locales: LocaleDefinition[]): LocaleResourceBundle[] {
  const normalized: LocaleResourceBundle[] = []

  for (const lang of locales) {
    if (lang.bundles && !Array.isArray(lang.bundles)) {
      throw new Error(`Resource bundle for locale ${lang.id} is not an array`)
    }

    if (!lang.bundles) {
      continue
    }

    for (const bundle of lang.bundles) {
      if ('locale' in bundle && bundle.locale !== lang.id) {
        throw new Error(`Resource bundle inside locale ${lang.id} has mismatching locale id`)
      }

      const ns = bundle.namespace
      if (!ns) {
        throw new Error(`Resource bundle for locale ${lang.id} is missing namespace`)
      }

      normalized.push('locale' in bundle ? bundle : {...bundle, locale: lang.id})
    }
  }

  return normalized
}

const defaultOptions: InitOptions = {
  /**
   * Even though we're only defining the studio namespace, i18next will still load requested
   * namespaces through the backend. The reason why we're defining the namespace at all is to
   * prevent i18next from (trying) to load the i18next default `translation` namespace.
   */
  ns: [studioLocaleNamespace],
  defaultNS: studioLocaleNamespace,
  partialBundledLanguages: true,

  // Fall back to English (US) locale
  fallbackLng: defaultLocale.id,

  // This will be overriden with the users detected/preferred locale before initing,
  // but to satisfy the init options and prevent mistakes, we include a defualt here.
  lng: defaultLocale.id,

  // In rare cases we'll want to be able to debug i18next - there is a `debug` option
  // in the studio i18n configuration for that, which will override this value.
  debug: DEBUG_I18N,

  // When specifying language 'en-US', do not load 'en-US', 'en', 'dev' - only `en-US`.
  load: 'currentOnly',

  // We always use our "backend" for loading translations, allowing us to handle i18n resources
  // in a single place with a single approach. This means we shouldn't need to wait for the init,
  // as any missing translations will be loaded async (through react suspense).
  initImmediate: true,

  // Because we use i18next-react, we do not need to escale values
  interpolation: {
    escapeValue: false,
  },

  // Theoretically, if the framework somehow gets new translations added, re-render.
  // Note that this shouldn't actually happen, as we only use the Sanity backend
  react: {
    bindI18nStore: 'added',
  },
}

/**
 * Get the i18next options to use for initializing the i18next instance
 *
 * @param projectId - The project ID to use for retrieving stored, preferred locale
 * @param sourceName - The source name to use for retrieving stored, preferred locale
 * @param locales - The available locales for this source
 * @param preferredLocale - The ID of the preferred locale, if none is stored
 * @returns The i18next options to use for initializing the i18next instance
 * @internal
 */
function getI18NextOptions(
  projectId: string,
  sourceName: string,
  locales: LocaleDefinition[],
  preferredLocale: string,
): InitOptions & {lng: string} {
  const storedLocaleId = getStoredLocale(projectId, sourceName)
  const storedLocale = storedLocaleId ? locales.find((l) => l.id === storedLocaleId) : undefined
  const locale = storedLocale?.id ?? preferredLocale ?? locales[0]?.id ?? defaultOptions.lng
  return {
    ...defaultOptions,
    lng: locale,
    supportedLngs: locales.map((def) => def.id),
  }
}

/**
 * Reduce a locale definition to a Locale instance
 *
 * @param definition - The locale definition to reduce
 * @returns A Locale instance
 * @internal
 */
function reduceLocaleDefinition(definition: LocaleDefinition): Locale {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {bundles, ...locale} = definition
  return locale
}
