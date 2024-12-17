/* eslint-disable no-nested-ternary */
import {usePaneRouter} from 'sanity/structure'

import {type LanguageFilterPluginOptions} from './types'

// NOTE: use `+` instead of `,` since the structure tool URL format already uses comma
const LANG_ID_SEPARATOR = '+'

export function usePaneLanguages(props: {options: LanguageFilterPluginOptions}): {
  selectableLanguages: {id: string; title: string}[]
  selectedLanguages: string[]
  selectAll: () => void
  selectNone: () => void
  toggleLanguage: (languageId: string) => void
} {
  const {options} = props
  const {params, setParams} = usePaneRouter()
  const selectableLanguages = options.supportedLanguages.filter(
    (lang) => !options.defaultLanguages?.includes(lang.id),
  )

  const selectedLanguages: string[] =
    params?.langs === '$none'
      ? []
      : params?.langs === '$all'
        ? selectableLanguages.map((lang) => lang.id)
        : params?.langs?.split(LANG_ID_SEPARATOR) || selectableLanguages.map((lang) => lang.id)

  const selectAll = () => {
    setParams({...params, langs: '$all'})
  }

  const selectNone = () => {
    setParams({...params, langs: '$none'})
  }

  const toggleLanguage = (languageId: string) => {
    let lang = selectedLanguages

    if (lang.includes(languageId)) {
      lang = lang.filter((l) => l !== languageId)
    } else {
      lang = [...lang, languageId]
    }

    if (lang.length === 0) {
      setParams({...params, langs: '$none'}) // none
      return
    }

    if (lang.length === selectableLanguages.length) {
      setParams({...params, langs: '$all'})
      return
    }

    setParams({...params, langs: lang.join(LANG_ID_SEPARATOR)})
  }

  return {selectableLanguages, selectedLanguages, selectAll, selectNone, toggleLanguage}
}
