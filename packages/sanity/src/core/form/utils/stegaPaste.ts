import {stegaClean} from '@sanity/client/stega'
import {type ClipboardEvent} from 'react'

/**
 * Input types that accept arbitrary text and can therefore receive stega'd clipboard content.
 * Types like `checkbox`, `radio`, `file` and `range` don't take textual paste input and are
 * deliberately excluded.
 */
const TEXTUAL_INPUT_TYPES = new Set([
  'date',
  'datetime-local',
  'email',
  'month',
  'number',
  'password',
  'search',
  'tel',
  'text',
  'time',
  'url',
  'week',
])

function isTextualElement(
  element: EventTarget | null,
): element is HTMLInputElement | HTMLTextAreaElement {
  if (element instanceof HTMLTextAreaElement) return true
  return element instanceof HTMLInputElement && TEXTUAL_INPUT_TYPES.has(element.type)
}

/**
 * Paste handler for native text inputs and textareas that strips stega metadata — invisible
 * unicode characters embedded by e.g. `@sanity/client/stega` to support visual editing — from the
 * pasted text.
 *
 * Text copied from a stega-enabled preview carries these characters along, and pasting it into a
 * plain text field would otherwise silently store them in the document. The Portable Text editor
 * already cleans pasted content (via `@portabletext/html`); this handler gives all other text
 * fields the same behavior.
 *
 * If the pasted text contains no stega characters the event is left untouched, deferring to the
 * browser's native paste behavior.
 *
 * @internal
 */
export function stripStegaFromPasteEvent(event: ClipboardEvent): void {
  const element = event.currentTarget
  if (!isTextualElement(element) || element.readOnly || element.disabled) return

  const text = event.clipboardData?.getData('text/plain')
  if (!text) return

  const cleanedText = stegaClean(text)
  if (cleanedText === text) return

  // The pasted text contains stega characters. Cancel the native paste and insert the cleaned
  // text instead.
  event.preventDefault()
  insertText(element, cleanedText)
}

/**
 * Replaces the current selection in the given element with `text`, in a way that triggers the
 * element's (React) `onChange`.
 */
function insertText(element: HTMLInputElement | HTMLTextAreaElement, text: string): void {
  // `execCommand` is deprecated, but it remains the only way to insert text that preserves the
  // browser's undo stack, and it is still supported by all major browsers.
  try {
    if (
      typeof document.execCommand === 'function' &&
      document.execCommand('insertText', false, text)
    ) {
      return
    }
  } catch {
    // fall through to the manual insertion below
  }

  // Fallback: splice the value manually and emit an `input` event. Inputs that don't support text
  // selection (e.g. `type="number"`) report `null` selection offsets; replace the entire value for
  // those.
  const {value} = element
  const start = element.selectionStart ?? 0
  const end = element.selectionEnd ?? value.length
  const nextValue = value.slice(0, start) + text + value.slice(end)

  // Set the value through the prototype setter so that React's internal value tracker doesn't
  // dedupe (swallow) the `input` event dispatched below.
  const valueSetter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'value')?.set
  if (valueSetter) {
    valueSetter.call(element, nextValue)
  } else {
    element.value = nextValue
  }

  try {
    const caret = start + text.length
    element.setSelectionRange(caret, caret)
  } catch {
    // Inputs like `type="number"` don't support selection manipulation
  }

  element.dispatchEvent(new Event('input', {bubbles: true}))
}
