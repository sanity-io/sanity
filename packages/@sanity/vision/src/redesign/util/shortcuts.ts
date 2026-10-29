import {isHotkey} from 'is-hotkey-esm'

export type VisionShortcutId = 'fetch' | 'prettify' | 'copy-query'

export interface VisionShortcut {
  id: VisionShortcutId
  /** `is-hotkey` patterns, any of which triggers the shortcut */
  hotkeys: string[]
  /** Keys as shown in the shortcuts dialog and menus, with the platform's modifier key */
  keys: string[]
  /** Locale key of the shortcut's description */
  labelKey: 'vision.shortcuts.fetch' | 'vision.shortcuts.prettify' | 'vision.shortcuts.copy-query'
}

const MOD_KEY =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform) ? '⌘' : 'Ctrl'

export const VISION_SHORTCUTS: Record<VisionShortcutId, VisionShortcut> = {
  'fetch': {
    id: 'fetch',
    hotkeys: ['mod+enter', 'ctrl+enter'],
    keys: [MOD_KEY, 'Enter'],
    labelKey: 'vision.shortcuts.fetch',
  },
  'prettify': {
    id: 'prettify',
    hotkeys: ['mod+shift+p'],
    keys: [MOD_KEY, 'Shift', 'P'],
    labelKey: 'vision.shortcuts.prettify',
  },
  'copy-query': {
    id: 'copy-query',
    hotkeys: ['mod+shift+c'],
    keys: [MOD_KEY, 'Shift', 'C'],
    labelKey: 'vision.shortcuts.copy-query',
  },
}

/** The shortcuts in the order the shortcuts dialog lists them */
export const VISION_SHORTCUT_LIST: VisionShortcut[] = Object.values(VISION_SHORTCUTS)

export interface EditorShortcut {
  keys: string[]
  labelKey:
    | 'vision.shortcuts.next-finding'
    | 'vision.shortcuts.complete'
    | 'vision.shortcuts.extract-function'
}

const ALT_KEY = MOD_KEY === '⌘' ? '⌥' : 'Alt'

/** The query editor's `EXTRACT_FUNCTION_KEY`, as the shortcuts dialog and hints show it */
export const EXTRACT_FUNCTION_SHORTCUT: EditorShortcut = {
  keys: [ALT_KEY, 'Enter'],
  labelKey: 'vision.shortcuts.extract-function',
}

/** Shortcuts CodeMirror handles inside the query editor, listed in the dialog so they can be found */
export const EDITOR_SHORTCUTS: EditorShortcut[] = [
  {keys: ['F8'], labelKey: 'vision.shortcuts.next-finding'},
  {keys: ['Ctrl', 'Space'], labelKey: 'vision.shortcuts.complete'},
  EXTRACT_FUNCTION_SHORTCUT,
]

export function matchVisionShortcut(event: KeyboardEvent): VisionShortcutId | null {
  const shortcut = VISION_SHORTCUT_LIST.find(({hotkeys}) =>
    hotkeys.some((hotkey) => isHotkey(hotkey, event)),
  )
  return shortcut ? shortcut.id : null
}
