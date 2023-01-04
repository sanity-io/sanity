import {studioTheme} from '@sanity/ui'

const IS_MAC =
  typeof window != 'undefined' && /Mac|iPod|iPhone|iPad/.test(window.navigator.platform)

// Enable debug mode when the current URL contains the below fragment.
// Must be prefixed with `_debug_`
export const DEBUG_FRAGMENT = '_debug_search_score'

// Display debug filter information: shared document types and field values
export const DEBUG_MODE = false

// Findability version, prepended to every search query for future measurement
export const FINDABILITY_MVI = 3

// Max number of records to fetch per search request - intentionally set high to workaround
// current limitations with studio search config
export const SEARCH_LIMIT = 1000

export const GLOBAL_SEARCH_KEY = 'k'
export const GLOBAL_SEARCH_KEY_MODIFIER = IS_MAC ? 'Cmd' : 'Ctrl'

export const POPOVER_INPUT_PADDING = studioTheme.space[1] // px
export const POPOVER_MAX_HEIGHT = 735 // px
export const POPOVER_MAX_WIDTH = 800 // px

// Custom space between buttons and popover content
export const POPOVER_VERTICAL_MARGIN = 5 // px

export const POPOVER_RADIUS = 2

export const VIRTUAL_LIST_SEARCH_ITEM_HEIGHT = 59 // px
export const VIRTUAL_LIST_SEARCH_OVERSCAN = 4
