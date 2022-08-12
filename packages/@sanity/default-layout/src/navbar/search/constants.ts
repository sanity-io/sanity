const IS_MAC =
  typeof window != 'undefined' && /Mac|iPod|iPhone|iPad/.test(window.navigator.platform)

export const SEARCH_LIMIT = 1000

export const GLOBAL_SEARCH_KEY = 'k'
export const GLOBAL_SEARCH_KEY_MODIFIER = IS_MAC ? 'Cmd' : 'Ctrl'

export const VIRTUAL_LIST_OVERSCAN = 4

export const VIRTUAL_LIST_CHILDREN_UI_NAME = 'search-results-virtual-list-children'
