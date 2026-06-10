import {WarningOutlineIcon} from '@sanity/icons'
import {type PreviewValue} from '@sanity/types'

export const INCLUDE_FIELDS_QUERY = ['_id', '_rev', '_type']
export const INCLUDE_FIELDS = [...INCLUDE_FIELDS_QUERY, '_key']

/**
 * Maximum length of textual preview values (title, subtitle, description).
 * Preview values are display-only; without a cap, a preview sourced from a very
 * large string field (e.g. a huge text body picked by title auto-detection) is
 * carried around and rendered wholesale.
 */
export const PREVIEW_STRING_MAX_LENGTH = 1024

/**
 * How long to wait after the last subscriber has unsubscribed before resetting the observable and disconnecting the listener.
 * We want to keep the listener alive for a short while after the last subscriber has unsubscribed to avoid unnecessary reconnects.
 * Reduced from 10s to 5s to limit concurrent SSE connections during navigation-heavy sessions.
 */
export const LISTENER_RESET_DELAY = 5_000

export const AVAILABILITY_READABLE = {
  available: true,
  reason: 'READABLE',
} as const

export const AVAILABILITY_PERMISSION_DENIED = {
  available: false,
  reason: 'PERMISSION_DENIED',
} as const

export const AVAILABILITY_NOT_FOUND = {
  available: false,
  reason: 'NOT_FOUND',
} as const

export const AVAILABILITY_VERSION_DELETED = {
  available: false,
  reason: 'VERSION_DELETED',
} as const

export const INVALID_PREVIEW_FALLBACK: PreviewValue = {
  title: 'Invalid preview config',
  subtitle: 'Check the error log in the console',
  media: <WarningOutlineIcon />,
}
