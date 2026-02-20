import {studioTheme} from '@sanity/ui'

// navigator.platform is deprecated but remains the most reliable way to detect Mac
// oxlint-disable typescript/no-deprecated
const IS_MAC =
  typeof window != 'undefined' && /Mac|iPod|iPhone|iPad/.test(window.navigator.platform)
// oxlint-enable typescript/no-deprecated

// Enable debug mode when the current URL contains the below fragment.
// Must be prefixed with `_debug_`
export const DEBUG_FRAGMENT = '_debug_search_score'

// Display debug filter information: shared document types and field values
export const DEBUG_MODE = false

// Max number of records to fetch per search request - intentionally set high to workaround
// current limitations with studio search config
export const SEARCH_LIMIT = 1000

export const GLOBAL_SEARCH_KEY = 'k'
export const GLOBAL_SEARCH_KEY_MODIFIER = IS_MAC ? 'Cmd' : 'Ctrl'

// oxlint-disable-next-line typescript/no-deprecated -- studioTheme.space is deprecated but will be migrated in a separate PR
export const POPOVER_INPUT_PADDING = studioTheme.space[4] // px
export const POPOVER_MAX_HEIGHT = 735 // px
export const POPOVER_MAX_WIDTH = 800 // px

// Custom space between buttons and popover content
export const POPOVER_VERTICAL_MARGIN = 5 // px

export const POPOVER_RADIUS = 3
