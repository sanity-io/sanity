import i18nApi, {type i18n} from 'i18next'
import type {SourceOptions} from '../config'
import {resolveConfigProperty} from '../config/resolveConfigProperty'
import {localeBundlesReducer, localeDefReducer} from '../config/configPropertyReducers'
import {defaultLocale} from './locales'
import {createSanityI18nBackend} from './backend'
import {LocaleSource, LocaleDefinition, LocaleResourceBundle} from './types'

/**
 * @todo Figure out the "source" naming, why would we name it a source?
 * @internal
 */
export function prepareI18nSource(source: SourceOptions): LocaleSource {
  const {projectId, dataset} = source
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

  const i18nSource = createI18nApi({
    locales,
    bundles,
  })

  return i18nSource
}

function createI18nApi({
  locales,
  bundles,
}: {
  locales: LocaleDefinition[]
  bundles: LocaleResourceBundle[]
}): LocaleSource {
  // We start out with an uninitialized instance - the async init call happens in LocaleProvider
  let i18nInstance = i18nApi.createInstance().use(createSanityI18nBackend({bundles}))
  return {
    locales,
    get t() {
      return i18nInstance.t
    },
    get i18next() {
      return i18nInstance
    },
    set i18next(newInstance: i18n) {
      i18nInstance = newInstance
    },
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
