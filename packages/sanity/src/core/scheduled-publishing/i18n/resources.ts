import {defineLocalesResources} from '../../i18n/helpers'

/**
 * The string resources for the studio core.
 *
 * @internal
 * @hidden
 */
export const scheduledPublishingLocaleStrings = defineLocalesResources('scheduled-publishing', {
  /* Tooltip content for the time zone dialog */
  'time-zone.time-zone-tooltip-scheduled-publishing':
    'Displaying schedules in {{alternativeName}} GMT{{offset}}',
})

export type ScheduledPublishingLocaleResourceKeys = keyof typeof scheduledPublishingLocaleStrings

export default scheduledPublishingLocaleStrings
