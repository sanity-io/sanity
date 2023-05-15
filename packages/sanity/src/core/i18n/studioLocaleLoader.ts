import {LanguageLoader} from '../config'
import {defaultLanguage, localizedLanguages} from './localizedLanguages'

const asyncStudioLocale = Object.values(localizedLanguages)
  .filter(
    //strings for default lang are loaded sync in i18n options
    (lang) => lang.id !== defaultLanguage.id
  )
  .map((lang) => lang.id)

export const studioLocaleLoader: LanguageLoader = async (lang) => {
  if (!asyncStudioLocale.includes(lang)) {
    return undefined
  }
  return import(`./locales/${lang}/studio.ts`)
}
