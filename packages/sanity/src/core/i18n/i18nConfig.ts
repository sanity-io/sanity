import {createInstance as createI18nInstance, type InitOptions, type i18n} from 'i18next'
import {initReactI18next} from 'react-i18next'
import type {SourceOptions} from '../config'
import {resolveConfigProperty} from '../config/resolveConfigProperty'
import {localeBundlesReducer, localeDefReducer} from '../config/configPropertyReducers'
import {defaultLocale} from './locales'
import {createSanityI18nBackend} from './backend'
import type {LocaleSource, LocaleDefinition, LocaleResourceBundle, Locale} from './types'
import {studioLocaleNamespace} from './localeNamespaces'
import {getPreferredLocale} from './localeStore'
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

  return createI18nApi({
    locales,
    bundles,
    projectId,
    sourceName,
  })
}

function createI18nApi({
  locales,
  bundles,
  projectId,
  sourceName,
}: {
  locales: LocaleDefinition[]
  bundles: LocaleResourceBundle[]
  projectId: string
  sourceName: string
}): {source: LocaleSource; i18next: i18n} {
  const options = getI18NextOptions(projectId, sourceName, locales)
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

function getI18NextOptions(
  projectId: string,
  sourceName: string,
  locales: LocaleDefinition[],
): InitOptions & {lng: string} {
  const preferredLocaleId = getPreferredLocale(projectId, sourceName)
  const preferredLocale = locales.find((l) => l.id === preferredLocaleId)
  const locale = preferredLocale?.id ?? locales[0]?.id ?? defaultOptions.lng
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
