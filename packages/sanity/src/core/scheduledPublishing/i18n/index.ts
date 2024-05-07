import {type LocaleResourceBundle} from '../../i18n'

/**
 * The locale namespace for the scheduled publishing tool
 *
 * @public
 */
export const scheduledPublishingNamespace = 'scheduledPublishing' as const

/**
 * The default locale bundle for the scheduled publishing tool, which is US English.
 *
 * @internal
 */
export const scheduledPublishingUsEnglishLocaleBundle: LocaleResourceBundle = {
  locale: 'en-US',
  namespace: scheduledPublishingNamespace,
  resources: () => import('./resources'),
}

/**
 * The locale resource keys for the scheduled publishing tool.
 *
 * @alpha
 * @hidden
 */
export type {ScheduledPublishingLocaleResourceKeys} from './resources'
