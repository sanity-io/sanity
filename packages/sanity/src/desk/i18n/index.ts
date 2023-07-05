import {defineLanguageResourceBundle} from 'sanity'

/**
 * The i18n namespace for the desk tool
 *
 * @public
 */
export const deskI18nNamespace = 'desk' as const

/**
 * The default language bundle for the desk tool, which is US English.
 *
 * @internal
 */
export const deskUsEnglishLanguageBundle = defineLanguageResourceBundle({
  language: 'en-US',
  namespace: deskI18nNamespace,
  resources: () => import('./resources'),
})

/**
 * The i18n resource keys for the desk tool.
 *
 * @public
 */
export type {I18nDeskResourceKeys} from './resources'
