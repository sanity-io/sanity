import {type TimeZoneScope} from '../hooks/useTimeZone'

export const Z_OFFSET = {
  toast: [100, 11000],
}

// timezone scopes
export const SCHEDULED_PUBLISHING_TIME_ZONE_SCOPE: TimeZoneScope = {type: 'scheduledPublishing'}
/**
 * The time zone scope of content releases and scheduled drafts, for `useTimeZone`.
 *
 * @internal
 */
export const CONTENT_RELEASES_TIME_ZONE_SCOPE: TimeZoneScope = {type: 'contentReleases'}
