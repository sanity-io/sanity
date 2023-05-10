import {useCallback, useRef} from 'react'
import {i18n} from 'i18next'
import {LanguageBundle, LanguageLoader} from '../config'

const NO_LANGS: string[] = []

function unwrapModule(maybeModule: LanguageBundle | {default: LanguageBundle}): LanguageBundle {
  return 'default' in maybeModule ? maybeModule.default : maybeModule
}

export function useLoadedLanguages(): (lang: string) => boolean {
  const loadedLangs = useRef(NO_LANGS)

  return useCallback(
    (lang: string) => {
      if (loadedLangs.current.includes(lang)) {
        return false
      }
      loadedLangs.current = [...loadedLangs.current, lang]
      return true
    },
    [loadedLangs],
  )
}

function addLoaderResult(
  lang: string,
  instance: i18n,
  loaderResult: LanguageBundle | {default: LanguageBundle} | undefined,
) {
  if (!loaderResult) {
    return
  }

  // eslint-disable-next-line no-param-reassign
  loaderResult = unwrapModule(loaderResult)
  const bundleArray = Array.isArray(loaderResult) ? loaderResult : [loaderResult]

  bundleArray
    .map((bundle) => unwrapModule(bundle))
    .forEach((bundle) => {
      instance.addResourceBundle(
        lang,
        bundle.namespace,
        bundle.resources,
        bundle.deep ?? true,
        bundle.overwrite ?? false,
      )
    })
}

export function useLoadLanguage(
  setLangLoaded: (lang: string) => boolean,
  languageLoaders: LanguageLoader[] | undefined,
): (lang: string, instance: i18n) => Promise<void> {
  return useCallback(
    async (lang: string, instance: i18n) => {
      if (!setLangLoaded(lang) || !languageLoaders) {
        return undefined
      }
      return runLanguageLoaders(lang, instance, languageLoaders).catch((e) => console.error(e))
    },
    [setLangLoaded, languageLoaders],
  )
}

export async function runLanguageLoaders(
  lang: string,
  instance: i18n,
  languageLoaders: LanguageLoader[],
): Promise<void> {
  const loadLangs = languageLoaders.map((loader) =>
    loader(lang, {i18n: instance})
      .then((loaderResult) => addLoaderResult(lang, instance, loaderResult))
      .catch((e) => console.error(e)),
  )
  await Promise.all(loadLangs)
}
