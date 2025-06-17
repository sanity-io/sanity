import {defineLocaleResourceBundle} from '../../i18n/helpers'

/**
 * The locale namespace for the scheduled publishing plugin
 *
 * @internal
 */
export const scheduledPublishingLocaleNamespace = 'scheduled-publishing' as const

/**
 * The default locale bundle for the vision tool, which is US English.
 *
 * @internal
 */
export const scheduledPublishingUsEnglishLocaleBundle = defineLocaleResourceBundle({
  locale: 'en-US',
  namespace: scheduledPublishingLocaleNamespace,
  resources: () => import('./resources'),
})
