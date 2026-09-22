import {isHotkey} from 'is-hotkey-esm'

export type VistaShortcutId = 'fetch' | 'prettify' | 'copy-query'

export interface VistaShortcut {
  id: VistaShortcutId
  /** `is-hotkey` patterns, any of which triggers the shortcut */
  hotkeys: string[]
  /** Keys as shown in the shortcuts dialog, with the platform's modifier key */
  keys: string[]
}

function isApplePlatform(): boolean {
  return typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform)
}

export function getVistaShortcuts(): VistaShortcut[] {
  const mod = isApplePlatform() ? '⌘' : 'Ctrl'
  return [
    {id: 'fetch', hotkeys: ['mod+enter', 'ctrl+enter'], keys: [mod, 'Enter']},
    {id: 'prettify', hotkeys: ['mod+shift+p'], keys: [mod, 'Shift', 'P']},
    {id: 'copy-query', hotkeys: ['mod+shift+c'], keys: [mod, 'Shift', 'C']},
  ]
}

export function matchVistaShortcut(event: KeyboardEvent): VistaShortcutId | null {
  const shortcut = getVistaShortcuts().find(({hotkeys}) =>
    hotkeys.some((hotkey) => isHotkey(hotkey, event)),
  )
  return shortcut ? shortcut.id : null
}
