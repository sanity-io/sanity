import {type BadgeTone} from '@sanity/ui'

import {type TimeZoneScope} from '../hooks/useTimeZone'
import {type ScheduleAction, type ScheduleState} from './types'

export const SCHEDULE_ACTION_DICTIONARY: Record<
  ScheduleAction,
  {
    actionName: string
    badgeColor?: 'primary' | 'success' | 'warning' | 'danger' // Document badge specific
    badgeTone: BadgeTone
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

/**
 * Locale keys (studio namespace) for the schedule state titles shown in the tool's state filter.
 * The English text matches `SCHEDULE_STATE_DICTIONARY`.
 */
export const SCHEDULE_STATE_TITLE_KEYS = {
  scheduled: 'scheduled-publishing.filter.state.scheduled',
  succeeded: 'scheduled-publishing.filter.state.succeeded',
  cancelled: 'scheduled-publishing.filter.state.cancelled',
} as const satisfies Record<ScheduleState, string>

// Tool: denotes order of filter tags as well as accessible routes
export const SCHEDULE_FILTERS: ScheduleState[] = Object.keys(SCHEDULE_STATE_DICTIONARY).filter(
  (f): f is ScheduleState => !!f,
)

export const TOOL_HEADER_HEIGHT = 55 // px

export const DOCUMENT_HAS_WARNINGS_TEXT = 'This document has validation warnings.'
export const DOCUMENT_HAS_ERRORS_TEXT =
  'This document has validation errors that should be resolved before its publish date.'

export const SCHEDULE_FAILED_TEXT = 'This schedule failed to run.'

export const TOOL_TITLE = 'Schedules'

export const RELEASES_DOCS_URL = 'https://www.sanity.io/blog/introducing-content-releases'

export const FORBIDDEN_RESPONSE_TEXT =
  'Forbidden. Please check that your project has access to Scheduled Publishing.'

export const SCHEDULED_PUBLISHING_TOOL_NAME = 'schedules'

export const SCHEDULED_PUBLISHING_TIME_ZONE_SCOPE: TimeZoneScope = {type: 'scheduledPublishing'}
