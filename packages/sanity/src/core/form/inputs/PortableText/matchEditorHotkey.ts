const IS_MAC =
  typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(window.navigator.userAgent)

const MODIFIERS: Record<string, 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey' | undefined> = {
  alt: 'altKey',
  control: 'ctrlKey',
  meta: 'metaKey',
  shift: 'shiftKey',
}

const ALIASES: Record<string, string> = {
  add: '+',
  break: 'pause',
  cmd: 'meta',
  command: 'meta',
  ctl: 'control',
  ctrl: 'control',
  del: 'delete',
  down: 'arrowdown',
  esc: 'escape',
  ins: 'insert',
  left: 'arrowleft',
  mod: IS_MAC ? 'meta' : 'control',
  opt: 'alt',
  option: 'alt',
  return: 'enter',
  right: 'arrowright',
  space: ' ',
  spacebar: ' ',
  up: 'arrowup',
  win: 'meta',
  windows: 'meta',
}

const KEY_CODES: Record<string, number> = {
  'backspace': 8,
  'tab': 9,
  'enter': 13,
  'shift': 16,
  'control': 17,
  'alt': 18,
  'pause': 19,
  'capslock': 20,
  'escape': 27,
  ' ': 32,
  'pageup': 33,
  'pagedown': 34,
  'end': 35,
  'home': 36,
  'arrowleft': 37,
  'arrowup': 38,
  'arrowright': 39,
  'arrowdown': 40,
  'insert': 45,
  'delete': 46,
  'meta': 91,
  'numlock': 144,
  'scrolllock': 145,
  ';': 186,
  '=': 187,
  ',': 188,
  '-': 189,
  '.': 190,
  '/': 191,
  '`': 192,
  '[': 219,
  '\\': 220,
  ']': 221,
  "'": 222,
  'f1': 112,
  'f2': 113,
  'f3': 114,
  'f4': 115,
  'f5': 116,
  'f6': 117,
  'f7': 118,
  'f8': 119,
  'f9': 120,
  'f10': 121,
  'f11': 122,
  'f12': 123,
  'f13': 124,
  'f14': 125,
  'f15': 126,
  'f16': 127,
  'f17': 128,
  'f18': 129,
  'f19': 130,
  'f20': 131,
}

interface ParsedHotkey {
  altKey: boolean | null
  ctrlKey: boolean | null
  metaKey: boolean | null
  shiftKey: boolean | null
  key?: string
  keyCode?: number
}

export interface HotkeyMatchEvent {
  altKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  key: string
  keyCode: number | undefined
}

function toKeyName(name: string): string {
  const keyName = name.toLowerCase()
  return ALIASES[keyName] ?? keyName
}

function toKeyCode(name: string): number {
  const keyName = toKeyName(name)
  return KEY_CODES[keyName] ?? keyName.toUpperCase().charCodeAt(0)
}

function parseHotkey(hotkey: string): ParsedHotkey {
  const parsed: ParsedHotkey = {altKey: false, ctrlKey: false, metaKey: false, shiftKey: false}
  const segments = hotkey.replace('++', '+add').split('+')

  for (const rawSegment of segments) {
    const optional = rawSegment.endsWith('?') && rawSegment.length > 1
    const segment = optional ? rawSegment.slice(0, -1) : rawSegment
    const keyName = toKeyName(segment)
    const modifierProperty = MODIFIERS[keyName]
    const alias = ALIASES[segment]
    const code = KEY_CODES[keyName]

    if (
      segment.length > 1 &&
      modifierProperty === undefined &&
      alias === undefined &&
      code === undefined
    ) {
      throw new TypeError(`Unknown modifier: "${segment}"`)
    }

    if (segments.length === 1 || modifierProperty === undefined) {
      parsed.key = keyName
      parsed.keyCode = toKeyCode(segment)
    }

    if (modifierProperty !== undefined) {
      parsed[modifierProperty] = optional ? null : true
    }
  }

  return parsed
}

/**
 * Matches a hotkey string against a keydown with the semantics of the matcher
 * in `@portabletext/editor`, which does not export it.
 */
export function matchEditorHotkey(hotkey: string, event: HotkeyMatchEvent): boolean {
  const parsed = parseHotkey(hotkey)

  if (
    (parsed.altKey != null && parsed.altKey !== event.altKey) ||
    (parsed.ctrlKey != null && parsed.ctrlKey !== event.ctrlKey) ||
    (parsed.metaKey != null && parsed.metaKey !== event.metaKey) ||
    (parsed.shiftKey != null && parsed.shiftKey !== event.shiftKey)
  ) {
    return false
  }

  if (parsed.keyCode !== undefined && event.keyCode !== undefined) {
    return (parsed.keyCode === 91 && event.keyCode === 93) || parsed.keyCode === event.keyCode
  }

  return parsed.keyCode === event.keyCode || parsed.key === event.key.toLowerCase()
}
