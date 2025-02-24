import {type BadgeTone} from '@sanity/ui'

import {
  type ScheduleAction,
  type ScheduledPublishingPluginOptions,
  type ScheduleState,
} from './types'

export const LOCAL_STORAGE_TZ_KEY = 'scheduled-publishing::time-zone'

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

// Text displayed in toasts on any 403 Forbidden request
// (usually if a project doesn't have access to the Scheduled Publishing feature)
export const FORBIDDEN_RESPONSE_TEXT =
  'Forbidden. Please check that your project has access to Scheduled Publishing.'

// date-fns compatible date formats
// https://date-fns.org/v2.28.0/docs/format
export const DATE_FORMAT = {
  // 1 Oct 22, 10:00 PM
  SMALL: `d MMM yy',' p`,
  // 1 October 2022, 10:00 PM
  MEDIUM: `d MMMM yyyy',' p`,
  // Saturday, 1 October 2022, 10:00 PM
  LARGE: `iiii',' d MMMM yyyy',' p`,
}

export const DEFAULT_SCHEDULED_PUBLISH_PLUGIN_OPTIONS: Required<
  Omit<ScheduledPublishingPluginOptions, '__internal__workspaceEnabled'>
> = {
  enabled: true,
  // 25/12/2022 22:00
  inputDateTimeFormat: 'dd/MM/yyyy HH:mm',
  showReleasesBanner: true,
}

export const SCHEDULED_PUBLISHING_TOOL_NAME = 'schedules'

export const TOOL_TITLE = 'Schedules'

export const RELEASES_DOCS_URL = 'https://www.sanity.io/blog/introducing-content-releases'
