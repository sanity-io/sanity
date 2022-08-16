import {studioTheme} from '@sanity/ui'

const IS_MAC =
  typeof window != 'undefined' && /Mac|iPod|iPhone|iPad/.test(window.navigator.platform)

// Findability version, prepended to every search query for future measurement
export const FINDABILITY_MVI = 1

// Max number of records to fetch per search request - intentionally set high to workaround
// current limitations with studio search config
export const SEARCH_LIMIT = 1000

export const GLOBAL_SEARCH_KEY = 'k'
export const GLOBAL_SEARCH_KEY_MODIFIER = IS_MAC ? 'Cmd' : 'Ctrl'

export const POPOVER_INPUT_PADDING = studioTheme.space[1] // px
export const POPOVER_MAX_HEIGHT = 735 // px
export const POPOVER_MAX_WIDTH = 800 // px

export const VIRTUAL_LIST_UI_NAME = 'search-results-virtual-list'
export const VIRTUAL_LIST_CHILDREN_UI_NAME = 'search-results-virtual-list-children'
export const VIRTUAL_LIST_ITEM_HEIGHT = 55 // px
export const VIRTUAL_LIST_OVERSCAN = 4
