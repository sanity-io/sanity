import {type TimeZoneScope} from '../hooks/useTimeZone'

export const Z_OFFSET = {
  toast: [100, 11000],
}

// timezone scopes
// this is currently being used in the DateEditFormField component
// eslint-disable-next-line no-warning-comments
// TODO: we should remove this once support for the scheduled publishing package is removed
export const SCHEDULED_PUBLISHING_TIME_ZONE_SCOPE: TimeZoneScope = {type: 'scheduledPublishing'}
export const CONTENT_RELEASES_TIME_ZONE_SCOPE: TimeZoneScope = {type: 'contentReleases'}
