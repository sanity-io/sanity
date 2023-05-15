import i18nApi, {type i18n, type InitOptions} from 'i18next'
import {Schema} from '@sanity/types'
import {I18nSource, LanguageDefinition, LanguageLoader, SourceOptions} from '../config'
import {resolveConfigProperty} from '../config/resolveConfigProperty'
import {
  i18nLangDefReducer,
  i18nLoaderReducer,
  i18nOptionsReducer,
} from '../config/configPropertyReducers'
import {studioI18nNamespaceStrings} from './locales/en-US/studio'
import {defaultLanguage} from './localizedLanguages'
import {getPreferredLang} from './languageStore'
import {schemaI18nNamespace, studioI18nNamespace} from './i18nNamespaces'
import {studioLocaleLoader} from './studioLocaleLoader'
import {i18nSchema} from './i18nSchema'

export const defaultI18nOptions: InitOptions = {
  partialBundledLanguages: true,
  defaultNS: studioI18nNamespace,
  lng: defaultLanguage.id,
  fallbackLng: defaultLanguage.id,
  resources: {
    [defaultLanguage.id]: {
      [studioI18nNamespace]: studioI18nNamespaceStrings,
      [schemaI18nNamespace]: {},
    },
  },
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

export function prepareI18nSource(source: SourceOptions, schema: Schema): I18nSource {
  const {projectId, dataset} = source
  const i18nLanguages = resolveConfigProperty({
    config: source,
    context: {projectId: projectId, dataset},
    propertyName: 'i18n',
    reducer: i18nLangDefReducer,
    initialValue: [defaultLanguage],
  })

  const i18nInitOptions = resolveConfigProperty({
    propertyName: 'i18n',
    config: source,
    context: {projectId, dataset},
    reducer: i18nOptionsReducer,
    initialValue: getInitialI18nOptions(projectId, source.name, i18nLanguages),
  })

  const i18nLoaders = resolveConfigProperty({
    config: source,
    context: {projectId, dataset},
    propertyName: 'i18n',
    reducer: i18nLoaderReducer,
    initialValue: [studioLocaleLoader],
  })

  const i18nSource = createI18nApi({
    languages: i18nLanguages,
    initOptions: i18nInitOptions,
    languageLoaders: i18nLoaders,
  })

  // no support for reducing this prop atm
  if (source.i18n?.experimentalTranslateSchemas) {
    i18nSchema(schema, i18nSource.i18next)
  }
  return i18nSource
}

function createI18nApi({
  languages,
  initOptions,
  languageLoaders,
}: {
  languages: LanguageDefinition[]
  initOptions: InitOptions
  languageLoaders: LanguageLoader[]
}): I18nSource {
  // We start out with an uninitialized instance.
  // The async init call happens in I18nProvider
  let i18nInstance = i18nApi.createInstance()
  return {
    languages,
    initOptions,
    languageLoaders,
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
