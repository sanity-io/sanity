import i18nApi, {type i18n, type InitOptions} from 'i18next'
import type {SourceOptions} from '../config'
import {resolveConfigProperty} from '../config/resolveConfigProperty'
import {
  i18nBundlesReducer,
  i18nLangDefReducer,
  i18nOptionsReducer,
} from '../config/configPropertyReducers'
import {defaultLanguage} from './localizedLanguages'
import {getPreferredLang} from './languageStore'
import {studioI18nNamespace} from './i18nNamespaces'
import {createSanityI18nBackend} from './backend'
import {I18nSource, LanguageDefinition, LanguageResourceBundle} from './types'

export const defaultI18nOptions: InitOptions = {
  partialBundledLanguages: true,
  defaultNS: studioI18nNamespace,
  lng: defaultLanguage.id,
  fallbackLng: defaultLanguage.id,
  debug: false,
  initImmediate: false,

  interpolation: {
    escapeValue: false, // handled by i18next-react
  },
  react: {
    bindI18nStore: 'added',
  },
}

export function getInitialI18nOptions(
  projectId: string,
  sourceId: string,
  languages: LanguageDefinition[]
): InitOptions {
  const langId = getPreferredLang(projectId, sourceId)
  const preferredLang = languages.find((l) => l.id === langId)
  const lng = preferredLang?.id ?? languages[0]?.id ?? defaultI18nOptions.lng
  return {
    ...defaultI18nOptions,
    lng,
    supportedLngs: languages.map((def) => def.id),
  }
}

export function prepareI18nSource(source: SourceOptions): I18nSource {
  const {projectId, dataset} = source
  const languages = resolveConfigProperty({
    config: source,
    context: {projectId: projectId, dataset},
    propertyName: 'i18n.languages',
    reducer: i18nLangDefReducer,
    initialValue: [defaultLanguage],
  })

  const bundles = resolveConfigProperty({
    config: source,
    context: {projectId: projectId, dataset},
    propertyName: 'i18n.bundles',
    reducer: i18nBundlesReducer,
    initialValue: normalizeResourceBundles(languages),
  })

  const i18nInitOptions = resolveConfigProperty({
    propertyName: 'i18n',
    config: source,
    context: {projectId, dataset},
    reducer: i18nOptionsReducer,
    initialValue: getInitialI18nOptions(projectId, source.name, languages),
  })

  const i18nSource = createI18nApi({
    languages,
    bundles,
    initOptions: i18nInitOptions,
  })

  return i18nSource
}

function createI18nApi({
  languages,
  bundles,
  initOptions,
}: {
  languages: LanguageDefinition[]
  bundles: LanguageResourceBundle[]
  initOptions: InitOptions
}): I18nSource {
  // We start out with an uninitialized instance - the async init call happens in I18nProvider
  let i18nInstance = i18nApi.createInstance().use(createSanityI18nBackend({bundles}))
  return {
    languages,
    initOptions,
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
 * Takes the i18n config and returns a normalized array of bundles from the defined languages.
 *
 * @param languages - The i18n languages defined in configuration/plugins
 * @returns An array of normalized bundles
 * @internal
 */
function normalizeResourceBundles(languages: LanguageDefinition[]): LanguageResourceBundle[] {
  const normalized: LanguageResourceBundle[] = []

  for (const lang of languages) {
    if (lang.bundles && !Array.isArray(lang.bundles)) {
      throw new Error(`Language bundle for language ${lang.id} is not an array`)
    }

    if (!lang.bundles) {
      continue
    }

    for (const bundle of lang.bundles) {
      if ('language' in bundle && bundle.language !== lang.id) {
        throw new Error(`Language bundle inside language ${lang.id} has mismatching language id`)
      }

      const ns = bundle.namespace
      if (!ns) {
        throw new Error(`Language bundle for language ${lang.id} is missing namespace`)
      }

      normalized.push('language' in bundle ? bundle : {...bundle, language: lang.id})
    }
  }

  return normalized
}
