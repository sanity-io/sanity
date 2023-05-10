import {localizedLanguages, defaultLanguage, type LanguageLoader} from 'sanity'

const asyncStudioLocale = Object.values(localizedLanguages)
  .filter(
    //strings for default lang are loaded sync in i18n options
    (lang) => lang.id !== defaultLanguage.id
  )
  .map((lang) => lang.id)

export const deskLocaleLoader: LanguageLoader = async (lang) => {
  if (!asyncStudioLocale.includes(lang)) {
    return undefined
  }
  return import(`./locales/${lang}/desk.ts`)
}
