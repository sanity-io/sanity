const IS_MAC =
  typeof window != 'undefined' && /Mac|iPod|iPhone|iPad/.test(window.navigator.platform)

export const SEARCH_LIMIT = 200

export const GLOBAL_SEARCH_KEY = 'k'
export const GLOBAL_SEARCH_KEY_MODIFIER = IS_MAC ? 'Cmd' : 'Ctrl'
