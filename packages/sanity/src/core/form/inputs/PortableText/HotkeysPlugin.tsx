import {useEditor, usePortableTextEditor} from '@portabletext/editor'
import {
  type BehaviorEvent,
  defineBehavior,
  effect,
  forward,
  raise,
} from '@portabletext/editor/behaviors'
import {useEffect} from 'react'
import {useEffectEvent} from 'use-effect-event'

import {type HotkeyOptions} from '../../types/inputProps'
import {createEventLike} from './eventLike'
import {useHotkeys} from './hooks/useHotKeys'
import {matchEditorHotkey} from './matchEditorHotkey'

type KeyboardOriginEvent = Extract<BehaviorEvent, {type: 'keyboard.keydown'}>['originEvent']

const NAMED_KEY_CODES: Record<string, number> = {
  AltLeft: 18,
  AltRight: 18,
  ArrowDown: 40,
  ArrowLeft: 37,
  ArrowRight: 39,
  ArrowUp: 38,
  Backquote: 192,
  Backslash: 220,
  Backspace: 8,
  BracketLeft: 219,
  BracketRight: 221,
  CapsLock: 20,
  Clear: 12,
  Comma: 188,
  ControlLeft: 17,
  ControlRight: 17,
  Delete: 46,
  End: 35,
  Enter: 13,
  Equal: 187,
  Escape: 27,
  Home: 36,
  Insert: 45,
  MetaLeft: 91,
  MetaRight: 93,
  Minus: 189,
  NumLock: 144,
  NumpadEnter: 13,
  PageDown: 34,
  PageUp: 33,
  Pause: 19,
  Period: 190,
  Quote: 222,
  ScrollLock: 145,
  Semicolon: 186,
  ShiftLeft: 16,
  ShiftRight: 16,
  Slash: 191,
  Space: 32,
  Tab: 9,
}

/**
 * Best-effort legacy matching from Behavior data. The original keyCode is not
 * available, so keyboard layouts can differ from native-event matching.
 */
function toKeyCode({key, code}: KeyboardOriginEvent): number | undefined {
  if (NAMED_KEY_CODES[key] !== undefined) {
    return NAMED_KEY_CODES[key]
  }
  const numpad = /^Numpad([0-9])$/.exec(code)
  if (numpad && /^[0-9]$/.test(key)) {
    return 96 + Number(numpad[1])
  }
  if (/^[a-z0-9]$/i.test(key)) {
    return key.toUpperCase().charCodeAt(0)
  }
  const physical = /^(?:Key([A-Z])|Digit([0-9]))$/.exec(code)
  if (physical) {
    return (physical[1] ?? physical[2]).charCodeAt(0)
  }
  const functionKey = /^F([0-9]{1,2})$/.exec(code)
  if (functionKey) {
    return 111 + Number(functionKey[1])
  }
  return NAMED_KEY_CODES[code]
}

function matchesHotkey(hotkey: string, event: KeyboardOriginEvent, keyCode: number | undefined) {
  return matchEditorHotkey(hotkey, {
    altKey: event.altKey,
    ctrlKey: event.ctrlKey,
    key: event.key,
    keyCode,
    metaKey: event.metaKey,
    shiftKey: event.shiftKey,
  })
}

export function HotkeysPlugin(props: {hotkeys?: HotkeyOptions; onToggleFullscreen: () => void}) {
  const {hotkeys, onToggleFullscreen} = props
  const editor = useEditor()
  // oxlint-disable-next-line no-deprecated -- the public custom hotkey callback receives this legacy editor
  const portableTextEditor = usePortableTextEditor()
  const editorHotkeys = useHotkeys({
    ...hotkeys,
    custom: {'mod+enter': onToggleFullscreen, ...hotkeys?.custom},
  })
  const getHotkeys = useEffectEvent(() => editorHotkeys)
  const getPortableTextEditor = useEffectEvent(() => portableTextEditor)
  // Keyed on the editor only: registering again would put this Behavior after the other plugins.
  useEffect(() => {
    const unregister = editor.registerBehavior({
      behavior: defineBehavior({
        on: 'keyboard.keydown',
        guard: ({event}) => {
          const current = getHotkeys()
          const keys = new Set([
            ...Object.keys(current.marks ?? {}),
            ...Object.keys(current.custom ?? {}),
          ])
          return Array.from(keys).some((hotkey) =>
            matchesHotkey(hotkey, event.originEvent, toKeyCode(event.originEvent)),
          )
        },
        actions: [
          ({event}) => {
            const keyCode = toKeyCode(event.originEvent)
            // Build a new KeyboardEvent. A Behavior event carries only the key data, not the browser's event.
            const originEvent = new KeyboardEvent('keydown', {
              key: event.originEvent.key,
              code: event.originEvent.code,
              altKey: event.originEvent.altKey,
              ctrlKey: event.originEvent.ctrlKey,
              metaKey: event.originEvent.metaKey,
              shiftKey: event.originEvent.shiftKey,
              cancelable: true,
            })
            const eventLike = Object.assign(createEventLike('keydown', originEvent), {
              key: originEvent.key,
              code: originEvent.code,
              altKey: originEvent.altKey,
              ctrlKey: originEvent.ctrlKey,
              metaKey: originEvent.metaKey,
              shiftKey: originEvent.shiftKey,
              keyCode,
              which: keyCode,
              getModifierState: (key: string) => originEvent.getModifierState(key),
            })
            // Several spellings can match one key press.
            // Run every matching mark and custom callback, not only the first.
            const decorators = Object.entries(getHotkeys().marks ?? {})
              .filter(([key]) => matchesHotkey(key, event.originEvent, keyCode))
              .map(([, decorator]) => decorator)
            const handlers = Object.entries(getHotkeys().custom ?? {})
              .filter(([key]) => matchesHotkey(key, event.originEvent, keyCode))
              .map(([, handler]) => handler)
            const runHandlers = () => {
              for (const handler of handlers) {
                handler(eventLike, getPortableTextEditor())
              }
            }
            if (decorators.length > 0) {
              eventLike.preventDefault()
              return [
                ...decorators.map((decorator) => raise({type: 'decorator.toggle', decorator})),
                ...(handlers.length > 0 ? [effect(runHandlers)] : []),
              ]
            }
            runHandlers()
            return eventLike.isDefaultPrevented() ? [] : [forward(event)]
          },
        ],
      }),
    })
    return unregister
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- useEffectEvent callbacks must not be listed
  }, [editor])

  return null
}
