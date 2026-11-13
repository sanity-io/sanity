import {useEditor, usePortableTextEditor} from '@portabletext/editor'
import {
  type BehaviorEvent,
  defineBehavior,
  effect,
  forward,
  raise,
} from '@portabletext/editor/behaviors'
import {
  type BaseSyntheticEvent,
  type ClipboardEvent as ReactClipboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react'

import {
  type HotkeyOptions,
  type OnCopyFn,
  type OnPasteFn,
  type PasteData,
} from '../../types/inputProps'
import {usePortableTextMemberSchemaTypes} from './contexts/PortableTextMemberSchemaTypes'
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

function createEventLike<T>(
  type: string,
  nativeEvent: T,
): BaseSyntheticEvent<T, EventTarget | null, EventTarget | null> {
  let defaultPrevented = false
  let propagationStopped = false

  return {
    bubbles: false,
    cancelable: true,
    currentTarget: null,
    get defaultPrevented() {
      return defaultPrevented
    },
    eventPhase: 0,
    isDefaultPrevented: () => defaultPrevented,
    isPropagationStopped: () => propagationStopped,
    isTrusted: false,
    nativeEvent,
    persist: () => undefined,
    preventDefault: () => {
      defaultPrevented = true
    },
    stopPropagation: () => {
      propagationStopped = true
    },
    target: null,
    timeStamp: Date.now(),
    type,
  }
}

// The legacy React type requires a cast: Behavior data has no DOM targets.
// The nativeEvent below is newly constructed, never the original browser event.
function createClipboardEventLike(
  type: 'copy' | 'paste',
  clipboardData: DataTransfer,
): ReactClipboardEvent<HTMLDivElement | HTMLSpanElement> {
  const nativeEvent = new ClipboardEvent(type, {clipboardData})
  // Firefox ignores the `clipboardData` init member and gives the event an empty DataTransfer
  Object.defineProperty(nativeEvent, 'clipboardData', {value: clipboardData})
  return Object.assign(createEventLike(type, nativeEvent), {
    clipboardData,
  }) as ReactClipboardEvent<HTMLDivElement | HTMLSpanElement>
}

/** Events contain only the data available to a Behavior, even for browser input. */
export function useHandlerBehaviors(props: {
  hotkeys?: HotkeyOptions
  onCopy?: OnCopyFn
  onPaste?: OnPasteFn
  onToggleFullscreen: () => void
}) {
  const {hotkeys, onCopy, onPaste, onToggleFullscreen} = props
  const editor = useEditor()
  // oxlint-disable-next-line no-deprecated -- the public custom hotkey callback receives this legacy editor
  const portableTextEditor = usePortableTextEditor()
  const schemaTypes = usePortableTextMemberSchemaTypes()
  const editorHotkeys = useHotkeys({
    ...hotkeys,
    custom: {'mod+enter': onToggleFullscreen, ...hotkeys?.custom},
  })

  // Keep callback updates from changing the Behavior registration order.
  // This ref contains props only, never a browser or Behavior event.
  const handlersRef = useRef({onCopy, onPaste, schemaTypes})
  useEffect(() => {
    handlersRef.current = {onCopy, onPaste, schemaTypes}
  }, [onCopy, onPaste, schemaTypes])
  const handleCopy = useCallback(
    (dataTransfer: DataTransfer) =>
      handlersRef.current.onCopy?.(createClipboardEventLike('copy', dataTransfer)),
    [],
  )
  const handlePaste = useCallback(
    (dataTransfer: DataTransfer, data: Pick<PasteData, 'path' | 'value'>) =>
      handlersRef.current.onPaste?.({
        ...data,
        event: createClipboardEventLike('paste', dataTransfer),
        schemaTypes: handlersRef.current.schemaTypes,
      }),
    [],
  )

  return useMemo(() => {
    // Skip the handler when an asynchronous paste resumes the editor's default path.
    const fallbackPastes = new WeakSet<DataTransfer>()
    const keys = new Set([
      ...Object.keys(editorHotkeys.marks ?? {}),
      ...Object.keys(editorHotkeys.custom ?? {}),
    ])
    return [
      ...Array.from(keys, (hotkey) =>
        defineBehavior({
          on: 'keyboard.keydown',
          guard: ({event}) =>
            matchesHotkey(hotkey, event.originEvent, toKeyCode(event.originEvent)),
          actions: [
            ({event}) => {
              const keyCode = toKeyCode(event.originEvent)
              // A newly constructed event: Behaviors never carry the browser's own.
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
              // Multiple spellings can match the same key. Like the legacy prop,
              // run every matching mark and custom callback before consuming it.
              const decorators = Object.entries(editorHotkeys.marks ?? {})
                .filter(([key]) => matchesHotkey(key, event.originEvent, keyCode))
                .map(([, decorator]) => decorator)
              const handlers = Object.entries(editorHotkeys.custom ?? {})
                .filter(([key]) => matchesHotkey(key, event.originEvent, keyCode))
                .map(([, handler]) => handler)
              const runHandlers = () => {
                for (const handler of handlers) {
                  handler(eventLike, portableTextEditor)
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
      ),
      defineBehavior({
        on: 'clipboard.paste',
        guard: ({snapshot, event}) => {
          const dataTransfer = event.originEvent.dataTransfer
          if (fallbackPastes.has(dataTransfer)) {
            return false
          }
          const result = handlePaste(dataTransfer, {
            path: snapshot.context.selection?.focus.path ?? [],
            value: snapshot.context.value,
          })
          return result ? {result} : false
        },
        actions: [
          ({event}, {result}) => {
            if (!('then' in result)) {
              return result.insert
                ? [raise({type: 'insert.blocks', blocks: result.insert, placement: 'auto'})]
                : [forward(event)]
            }
            return [
              effect(async ({send}) => {
                let resolved
                try {
                  resolved = await result
                } catch (error) {
                  console.warn(error)
                  return
                }
                if (resolved?.insert) {
                  send({type: 'insert.blocks', blocks: resolved.insert, placement: 'auto'})
                  return
                }
                const selection = editor.getSnapshot().context.selection
                if (!selection) {
                  console.warn('Could not find position for paste event')
                  return
                }
                fallbackPastes.add(event.originEvent.dataTransfer)
                send({...event, position: {selection}})
              }),
            ]
          },
        ],
      }),
      // oxlint-disable-next-line react/refs -- defineBehavior stores this guard; the editor calls it outside render
      defineBehavior({
        on: 'clipboard.copy',
        guard: ({event}) => {
          const result = handleCopy(event.originEvent.dataTransfer)
          return result !== undefined
        },
        actions: [],
      }),
    ]
  }, [editor, editorHotkeys, handleCopy, handlePaste, portableTextEditor])
}
