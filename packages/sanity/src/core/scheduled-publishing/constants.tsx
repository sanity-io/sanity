import {type ElementTone} from '@sanity/ui/theme'

import {type TimeZoneScope} from '../hooks/useTimeZone'
import {type ScheduleAction, type ScheduleState} from './types'

export const SCHEDULE_ACTION_DICTIONARY: Record<
  ScheduleAction,
  {
    actionName: string
    badgeColor?: 'primary' | 'success' | 'warning' | 'danger' // Document badge specific
    badgeTone: ElementTone
  }
> = {
  publish: {
    actionName: 'Publishing',
    badgeColor: 'primary',
    badgeTone: 'positive',
  },
  unpublish: {
    actionName: 'Unpublishing',
    badgeColor: 'danger',
    badgeTone: 'critical',
  },
}

export const SCHEDULE_STATE_DICTIONARY: Record<
  ScheduleState,
  {
    title: string
  }
> = {
  scheduled: {
    title: 'Upcoming',
  },
  succeeded: {
    title: 'Completed',
  },
  cancelled: {
    title: 'Failed',
  },
}

// Tool: denotes order of filter tags as well as accessible routes
export const SCHEDULE_FILTERS: ScheduleState[] = Object.keys(SCHEDULE_STATE_DICTIONARY).filter(
  (f): f is ScheduleState => !!f,
)

export const TOOL_HEADER_HEIGHT = 55 // px

export const DOCUMENT_HAS_WARNINGS_TEXT = 'This document has validation warnings.'
export const DOCUMENT_HAS_ERRORS_TEXT =
  'This document has validation errors that should be resolved before its publish date.'

export const FEATURE_NOT_SUPPORTED_TEXT = (
  <>
    Scheduled Publishing is only available on{' '}
    <a href="https://sanity.io/pricing">Growth or higher plans</a>. Please upgrade to enable access.
  </>
)

export const SCHEDULE_FAILED_TEXT = 'This schedule failed to run.'

export const TOOL_TITLE = 'Schedules'

export const RELEASES_DOCS_URL = 'https://www.sanity.io/blog/introducing-content-releases'

export const FORBIDDEN_RESPONSE_TEXT =
  'Forbidden. Please check that your project has access to Scheduled Publishing.'

export const SCHEDULED_PUBLISHING_TOOL_NAME = 'schedules'

export const SCHEDULED_PUBLISHING_TIME_ZONE_SCOPE: TimeZoneScope = {type: 'scheduledPublishing'}
