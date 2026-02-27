import {toHTML} from '@portabletext/to-html'
import {isPortableTextBlock, toPlainText} from '@portabletext/toolkit'
import {
  isBlockSchemaType,
  isSpanSchemaType,
  type ObjectField,
  type ObjectSchemaType,
  type Path,
  type PortableTextBlock,
} from '@sanity/types'

import {isString} from '../../util/isString'
import {type SanityClipboardItem} from './types'

/**
 * The custom mimetype used when populating a ClipboardItem. Note that this
 * uses the new `web ` prefix. This is not currently implemented in Safari and
 * Firefox as of 2024-07-08.
 *
 * https://caniuse.com/mdn-api_clipboarditem_supports_static_optional_type_web
 * https://github.com/w3c/editing/blob/gh-pages/docs/clipboard-pickling/explainer.md
 */
const MIMETYPE_SANITY_CLIPBOARD = 'web application/vnd.sanity-clipboard-item+json'
const MIMETYPE_HTML = 'text/html'
const MIMETYPE_PLAINTEXT = 'text/plain'
const MIMETYPE_PORTABLE_TEXT = 'web application/x-portable-text'

/**
 * Reports whether or not the current browser supports custom mimetype types
 * within the clipboard. Note that this uses the new ClipboardItem.supports
 * method that was released in Chrome/Edge 121 and is currently not implemented
 * in Safari and Firefox.
 *
 * https://caniuse.com/mdn-api_clipboarditem_supports_static_optional_type_web
 */
const SUPPORTS_SANITY_CLIPBOARD_MIMETYPE =
  typeof ClipboardItem !== 'undefined' &&
  'supports' in ClipboardItem &&
  ClipboardItem.supports(MIMETYPE_SANITY_CLIPBOARD)

const SUPPORTS_PORTABLE_TEXT_MIMETYPE =
  typeof ClipboardItem !== 'undefined' &&
  'supports' in ClipboardItem &&
  ClipboardItem.supports(MIMETYPE_PORTABLE_TEXT)

/**
 * The name of the attributed used to store the base64 data. Note that we store
 * serialized data into a base64 data attribute because safari will mangle and
 * sanitize the HTML pasted into the clipboard, however it keeps data attributes
 * https://stackoverflow.com/a/68958287/5776910
 */
const BASE64_ATTR = 'sanity-clipboard-base64'

export async function getClipboardItem(): Promise<SanityClipboardItem | null> {
  const items = await navigator.clipboard.read()

  for (const item of items) {
    const sanityClipboardItem = await parseClipboardItem(item)
    if (!sanityClipboardItem) continue
    return sanityClipboardItem
  }

  return null
}

/**
 * Type guard to check if a value looks like a TypedObject (has _type property)
 */
function isTypedObject(value: unknown): value is {_type: string} {
  return typeof value === 'object' && value !== null && '_type' in value
}

/**
 * Check if a value is a Portable Text array
 */
function isPortableTextValue(value: unknown): boolean {
  if (!Array.isArray(value)) return false
  return value.some((item) => isTypedObject(item) && isPortableTextBlock(item))
}

export async function writeClipboardItem(copyActionResult: SanityClipboardItem): Promise<boolean> {
  const textValue = transformValueToText(copyActionResult.value)
  // we use a utf8-safe base64 encoded string to preserve the data as safely as
  // possible when serializing into HTML
  const base64SanityClipboardItem = utf8ToBase64(JSON.stringify(copyActionResult))

  // Check if the value is Portable Text for x-portable-text format
  const isPTE = isPortableTextValue(copyActionResult.value)

  // Generate semantic HTML for external applications, with embedded base64 data for Safari fallback
  const htmlValue = transformValueToHtml(copyActionResult.value)
  // Wrap in a container with the base64 data attribute for round-trip support
  const htmlWithData = `<div data-${BASE64_ATTR}="${base64SanityClipboardItem}">${htmlValue}</div>`

  const clipboardItem = new ClipboardItem({
    ...(SUPPORTS_SANITY_CLIPBOARD_MIMETYPE && {
      [MIMETYPE_SANITY_CLIPBOARD]: new Blob([JSON.stringify(copyActionResult)], {
        type: MIMETYPE_SANITY_CLIPBOARD,
      }),
    }),
    // Include x-portable-text format for PTE-to-PTE paste operations
    ...(isPTE &&
      SUPPORTS_PORTABLE_TEXT_MIMETYPE && {
        [MIMETYPE_PORTABLE_TEXT]: new Blob([JSON.stringify(copyActionResult.value)], {
          type: MIMETYPE_PORTABLE_TEXT,
        }),
      }),
    [MIMETYPE_HTML]: new Blob([htmlWithData], {type: MIMETYPE_HTML}),
    [MIMETYPE_PLAINTEXT]: new Blob([textValue], {type: MIMETYPE_PLAINTEXT}),
  })

  try {
    await navigator.clipboard.write([clipboardItem])
    return true
  } catch (error) {
    // Re-throw permission errors so they can be handled specifically
    if (error.name === 'NotAllowedError') {
      throw error
    }
    console.error(`Failed to write to clipboard: ${error.message}`, error)
    return false
  }
}

export async function parseClipboardItem(item: ClipboardItem): Promise<SanityClipboardItem | null> {
  if (item.types.includes(MIMETYPE_SANITY_CLIPBOARD)) {
    const blob = await item.getType(MIMETYPE_SANITY_CLIPBOARD)
    const text = await blob.text()
    return JSON.parse(text)
  }

  if (!item.types.includes(MIMETYPE_HTML)) return null
  const blob = await item.getType(MIMETYPE_HTML)
  const html = await blob.text()

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  try {
    const el = doc.querySelector(`[data-${BASE64_ATTR}]`) as HTMLElement
    if (!el) return null

    type CamelCase<S extends string> = S extends `${infer P1}-${infer P2}${infer P3}`
      ? `${P1}${Capitalize<P2>}${CamelCase<P3>}`
      : S

    const {sanityClipboardBase64} = el.dataset as Record<CamelCase<typeof BASE64_ATTR>, string>
    if (!sanityClipboardBase64) return null

    return JSON.parse(base64ToUtf8(sanityClipboardBase64))
  } catch {
    return null
  }
}

/**
 * allows for a safe conversion of utf-8 text to a base64 string
 */
function utf8ToBase64(text: string) {
  const encoder = new TextEncoder()
  const uint8Array = encoder.encode(text)
  let binary = ''
  for (let i = 0; i < uint8Array.byteLength; i++) {
    binary += String.fromCharCode(uint8Array[i])
  }
  return btoa(binary)
}

function base64ToUtf8(base64String: string) {
  const binary = atob(base64String)
  const uint8Array = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    uint8Array[i] = binary.charCodeAt(i)
  }
  const decoder = new TextDecoder()
  return decoder.decode(uint8Array)
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Convert Portable Text value to semantic HTML for clipboard using \@portabletext/to-html
 */
function transformValueToHtml(value: unknown): string {
  if (!value) return ''
  if (isString(value)) return `<p>${escapeHtml(value)}</p>`
  if (Number.isFinite(value)) return `<p>${value}</p>`

  if (Array.isArray(value)) {
    // Check if this is a Portable Text array
    if (value.some((item) => isTypedObject(item) && isPortableTextBlock(item))) {
      return toHTML(value as PortableTextBlock[])
    }

    // Regular array - join as comma-separated text in a paragraph
    const text = value.map(transformValueToText).filter(Boolean).join(', ')
    return text ? `<p>${escapeHtml(text)}</p>` : ''
  }

  if (typeof value === 'object') {
    // Check if this is a single Portable Text block
    if (isTypedObject(value) && isPortableTextBlock(value)) {
      return toHTML([value as PortableTextBlock])
    }

    // Regular object - extract non-underscore values
    const text = Object.entries(value)
      .map(([key, subValue]) => (key.startsWith('_') ? '' : transformValueToText(subValue)))
      .filter(Boolean)
      .join(', ')
    return text ? `<p>${escapeHtml(text)}</p>` : ''
  }

  return ''
}

export function transformValueToText(value: unknown): string {
  if (!value) return ''
  if (isString(value)) return value
  if (Number.isFinite(value)) return value.toString()

  if (Array.isArray(value)) {
    // Check if this is a Portable Text array (has at least one PTE block)
    if (value.some((item) => isTypedObject(item) && isPortableTextBlock(item))) {
      return toPlainText(value)
    }
    return value.map(transformValueToText).filter(Boolean).join(', ')
  }

  if (typeof value === 'object') {
    // Check if this is a single Portable Text block
    if (isTypedObject(value) && isPortableTextBlock(value)) {
      return toPlainText(value)
    }
    return Object.entries(value)
      .map(([key, subValue]) => (key.startsWith('_') ? '' : transformValueToText(subValue)))
      .filter(Boolean)
      .join(', ')
  }

  return ''
}

export function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'object') {
    const keys = Object.keys(value)
    // An object is effectively empty if it only has `_key` (no content at all)
    if (keys.length === 1 && keys[0] === '_key') {
      return true
    }
  }
  if (Array.isArray(value) && value.length === 0) return true
  return false
}

/**
 * Checks if a field name is a Portable Text field that should preserve
 * empty arrays during copy/paste operations.
 *
 */
export function isPortableTextPreserveEmptyField(
  member: ObjectField,
  targetSchemaType: ObjectSchemaType,
): boolean {
  return (
    (member.name === 'markDefs' && isBlockSchemaType(targetSchemaType)) ||
    (member.name === 'marks' && isSpanSchemaType(targetSchemaType))
  )
}

export function isNativeEditableElement(el: EventTarget): boolean {
  if (el instanceof HTMLElement && el.isContentEditable) return true
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return true
  return false
}

export function hasSelection(): boolean {
  if (typeof window === 'undefined' || !window.getSelection) return false

  const selection = window.getSelection()
  return selection !== null && !selection.isCollapsed
}

/** @internal */
export function isEmptyFocusPath(path: Path): boolean {
  return path.length === 0 || (path.length === 1 && path[0] === '')
}
