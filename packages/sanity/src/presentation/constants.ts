import {ComposeIcon} from '@sanity/icons'

export const DEFAULT_TOOL_ICON = ComposeIcon
export const DEFAULT_TOOL_NAME = 'presentation'
export const DEFAULT_TOOL_TITLE = 'Presentation'

export const EDIT_INTENT_MODE = 'presentation'

// How long we wait until an iframe is loaded until we consider it to be slow and possibly failed
export const MAX_TIME_TO_OVERLAYS_CONNECTION = 3_000 // ms

// The API version to use when using `@sanity/client`
// TODO: COREL - Replace once releases API are stable.
export const API_VERSION = 'vX'

// Heartbeats shouldn't fire on intervals that are so short it causes performance issues
export const MIN_LOADER_QUERY_LISTEN_HEARTBEAT_INTERVAL = 1000 // ms

// Batch size for fetching documents building up the cache
export const LIVE_QUERY_CACHE_BATCH_SIZE = 100

// Total cache size for documents that are live queried
export const LIVE_QUERY_CACHE_SIZE = 2048

// The interval at which we check if existing popups have been closed
export const POPUP_CHECK_INTERVAL = 1000 // ms

declare global {
  const PRESENTATION_ENABLE_LIVE_DRAFT_EVENTS: unknown
}

// Feature flag that uses the new Live Draft Content API instead of the Listen API + Mendoza events
export const LIVE_DRAFT_EVENTS_ENABLED =
  typeof PRESENTATION_ENABLE_LIVE_DRAFT_EVENTS === 'string'
    ? PRESENTATION_ENABLE_LIVE_DRAFT_EVENTS === 'true'
    : process.env.SANITY_STUDIO_PRESENTATION_ENABLE_LIVE_DRAFT_EVENTS === 'true'
