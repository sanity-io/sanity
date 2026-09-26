import {isHotkey} from 'is-hotkey-esm'

export type VistaShortcutId = 'fetch' | 'prettify' | 'copy-query'

export interface VistaShortcut {
  id: VistaShortcutId
  /** `is-hotkey` patterns, any of which triggers the shortcut */
  hotkeys: string[]
  /** Keys as shown in the shortcuts dialog and menus, with the platform's modifier key */
  keys: string[]
  /** Locale key of the shortcut's description */
  labelKey: 'vista.shortcuts.fetch' | 'vista.shortcuts.prettify' | 'vista.shortcuts.copy-query'
}

const MOD_KEY =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform) ? '⌘' : 'Ctrl'

export const VISTA_SHORTCUTS: Record<VistaShortcutId, VistaShortcut> = {
  'fetch': {
    id: 'fetch',
    hotkeys: ['mod+enter', 'ctrl+enter'],
    keys: [MOD_KEY, 'Enter'],
    labelKey: 'vista.shortcuts.fetch',
  },
  'prettify': {
    id: 'prettify',
    hotkeys: ['mod+shift+p'],
    keys: [MOD_KEY, 'Shift', 'P'],
    labelKey: 'vista.shortcuts.prettify',
  },
  'copy-query': {
    id: 'copy-query',
    hotkeys: ['mod+shift+c'],
    keys: [MOD_KEY, 'Shift', 'C'],
    labelKey: 'vista.shortcuts.copy-query',
  },
}

/** The shortcuts in the order the shortcuts dialog lists them */
export const VISTA_SHORTCUT_LIST: VistaShortcut[] = Object.values(VISTA_SHORTCUTS)

export interface EditorShortcut {
  keys: string[]
  labelKey: 'vista.shortcuts.next-finding'
}

/** Shortcuts CodeMirror handles inside the query editor, listed in the dialog so they can be found */
export const EDITOR_SHORTCUTS: EditorShortcut[] = [
  {keys: ['F8'], labelKey: 'vista.shortcuts.next-finding'},
]

export function matchVistaShortcut(event: KeyboardEvent): VistaShortcutId | null {
  const shortcut = VISTA_SHORTCUT_LIST.find(({hotkeys}) =>
    hotkeys.some((hotkey) => isHotkey(hotkey, event)),
  )
  return shortcut ? shortcut.id : null
}
