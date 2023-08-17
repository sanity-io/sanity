import {useCallback, useMemo} from 'react'
import {usePaneRouter} from 'sanity/desk'
import {LanguageFilterPluginOptions} from './types'

// NOTE: use `+` instead of `,` since the desk tool URL format already uses comma
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

  const selectedLanguages: string[] = useMemo(() => {
    if (params?.langs === '$none') {
      return []
    }

    if (params?.langs === '$all') {
      return selectableLanguages.map((lang) => lang.id)
    }

    return params?.langs?.split(LANG_ID_SEPARATOR) || selectableLanguages.map((lang) => lang.id)
  }, [params, selectableLanguages])

  const selectAll = useCallback(() => {
    setParams({...params, langs: '$all'})
  }, [params, setParams])

  const selectNone = useCallback(() => {
    setParams({...params, langs: '$none'})
  }, [params, setParams])

  const toggleLanguage = useCallback(
    (languageId: string) => {
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
    },
    [params, selectableLanguages, selectedLanguages, setParams],
  )

  return {selectableLanguages, selectedLanguages, selectAll, selectNone, toggleLanguage}
}
