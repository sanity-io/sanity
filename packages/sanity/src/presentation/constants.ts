import {ComposeIcon} from '@sanity/icons'
import {apiVersion} from '@sanity/preview-url-secret/constants'

export const DEFAULT_TOOL_ICON = ComposeIcon
export const DEFAULT_TOOL_NAME = 'presentation'
export const DEFAULT_TOOL_TITLE = 'Presentation'

export const EDIT_INTENT_MODE = 'presentation'

// How long we wait until an iframe is loaded until we consider it to be slow and possibly failed
export const MAX_TIME_TO_OVERLAYS_CONNECTION = 3_000 // ms

// The API version to use when using `@sanity/client`
export const API_VERSION = apiVersion

// Heartbeats shouldn't fire on intervals that are so short it causes performance issues
export const MIN_LOADER_QUERY_LISTEN_HEARTBEAT_INTERVAL = 1000 // ms

// How often the list over loader queries should be garbage collected
export const LOADER_QUERY_GC_INTERVAL = 30_000 // ms

// The interval at which we check if existing popups have been closed
export const POPUP_CHECK_INTERVAL = 1000 // ms
