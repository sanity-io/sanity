import {type ResponsiveProp} from '@sanity/ui/css'

import {type TimeZoneScope} from '../hooks/useTimeZone'

export const Z_OFFSET = {
  toast: [100, 11000] satisfies ResponsiveProp<number>,
}

// timezone scopes
export const SCHEDULED_PUBLISHING_TIME_ZONE_SCOPE: TimeZoneScope = {type: 'scheduledPublishing'}
export const CONTENT_RELEASES_TIME_ZONE_SCOPE: TimeZoneScope = {type: 'contentReleases'}
