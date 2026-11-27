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

const PLATFORM = typeof navigator === 'undefined' ? '' : navigator.platform
const IS_MAC = /Mac|iPhone|iPad|iPod/.test(PLATFORM)
const MOD_KEY = IS_MAC ? '⌘' : 'Ctrl'
const ALT_KEY = IS_MAC ? '⌥' : 'Alt'

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

export type VisionTabShortcutId = 'new-tab' | 'close-tab' | 'next-tab' | 'previous-tab'

export interface VisionTabShortcut {
  id: VisionTabShortcutId
  /** `is-hotkey` patterns, any of which triggers the shortcut */
  hotkeys: string[]
  /** The keys browsers leave to the page, as the shortcuts dialog and tooltips show them */
  keys: string[]
  /**
   * VS Code's own keys for the action. Browsers keep them for their own windows and tabs, so they
   * only reach the tool where the browser has no tabs of its own, as in an installed app window
   */
  vscodeKeys: string[]
  /** Locale key of the shortcut's description */
  labelKey: `vision.shortcuts.${VisionTabShortcutId}`
}

/**
 * Browsers keep VS Code's own keys for their windows and tabs, so each tab shortcut also has keys
 * close to them that browsers leave to the page. New and close add Alt (⌥) to ⌘N and ⌘W, as
 * VS Code for the Web does for New File. Next and previous take VS Code's other keys for them:
 * with ⌥ instead of ⇧ on a Mac (⌥⌘] for ⇧⌘]), and with Alt added on Windows and Linux
 * (Ctrl+Alt+PageDown for Ctrl+PageDown), as Firefox keeps Ctrl+Alt+Tab for itself.
 */
export const VISION_TAB_SHORTCUTS: Record<VisionTabShortcutId, VisionTabShortcut> = {
  'new-tab': {
    id: 'new-tab',
    hotkeys: ['mod+n', 'mod+alt+n'],
    keys: [MOD_KEY, ALT_KEY, 'N'],
    vscodeKeys: [MOD_KEY, 'N'],
    labelKey: 'vision.shortcuts.new-tab',
  },
  'close-tab': {
    id: 'close-tab',
    hotkeys: PLATFORM.startsWith('Win')
      ? ['mod+w', 'ctrl+f4', 'mod+alt+w']
      : ['mod+w', 'mod+alt+w'],
    keys: [MOD_KEY, ALT_KEY, 'W'],
    vscodeKeys: [MOD_KEY, 'W'],
    labelKey: 'vision.shortcuts.close-tab',
  },
  'next-tab': {
    id: 'next-tab',
    hotkeys: ['ctrl+tab', IS_MAC ? 'mod+alt+]' : 'ctrl+alt+pagedown'],
    keys: IS_MAC ? [MOD_KEY, ALT_KEY, ']'] : ['Ctrl', 'Alt', 'PageDown'],
    vscodeKeys: ['Ctrl', 'Tab'],
    labelKey: 'vision.shortcuts.next-tab',
  },
  'previous-tab': {
    id: 'previous-tab',
    hotkeys: ['ctrl+shift+tab', IS_MAC ? 'mod+alt+[' : 'ctrl+alt+pageup'],
    keys: IS_MAC ? [MOD_KEY, ALT_KEY, '['] : ['Ctrl', 'Alt', 'PageUp'],
    vscodeKeys: ['Ctrl', 'Shift', 'Tab'],
    labelKey: 'vision.shortcuts.previous-tab',
  },
}

/** The tab shortcuts in the order the shortcuts dialog lists them */
export const VISION_TAB_SHORTCUT_LIST: VisionTabShortcut[] = Object.values(VISION_TAB_SHORTCUTS)

export interface EditorShortcut {
  keys: string[]
  labelKey:
    | 'vision.shortcuts.next-finding'
    | 'vision.shortcuts.complete'
    | 'vision.shortcuts.extract-function'
}

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

function findShortcut<T extends {hotkeys: string[]}>(
  shortcuts: T[],
  event: KeyboardEvent,
): T | undefined {
  return shortcuts.find(({hotkeys}) => hotkeys.some((hotkey) => isHotkey(hotkey, event)))
}

export function matchVisionShortcut(event: KeyboardEvent): VisionShortcutId | null {
  return findShortcut(VISION_SHORTCUT_LIST, event)?.id ?? null
}

export function matchVisionTabShortcut(event: KeyboardEvent): VisionTabShortcutId | null {
  return findShortcut(VISION_TAB_SHORTCUT_LIST, event)?.id ?? null
}
