import {defineLocaleResourceBundle} from '../../core/i18n/helpers'

/**
 * The locale namespace for the presentation tool
 *
 * @public
 */
export const presentationLocaleNamespace = 'presentation' as const

/**
 * The default locale bundle for the presentation tool, which is US English.
 *
 * @internal
 */
export const presentationUsEnglishLocaleBundle = defineLocaleResourceBundle({
  locale: 'en-US',
  namespace: presentationLocaleNamespace,
  resources: () => import('./resources'),
})
