import isHotkey from 'is-hotkey'

export const IS_MAC =
  typeof window != 'undefined' && /Mac|iPod|iPhone|iPad/.test(window.navigator.platform)

export const globalModKey = IS_MAC ? 'Cmd' : 'Ctrl'
export const globalSearchKey = 'k'

export const isSearchHotKey = isHotkey(`mod+${globalSearchKey}`)
export const isEscape = isHotkey('escape')
