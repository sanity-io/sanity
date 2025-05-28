import {type Path} from '@sanity/types'

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

export async function writeClipboardItem(copyActionResult: SanityClipboardItem): Promise<boolean> {
  const textValue = transformValueToText(copyActionResult.value)
  const escapedTextValue = escapeHtml(textValue)
  // we use a utf8-safe base64 encoded string to preserve the data as safely as
  // possible when serializing into HTML
  const base64SanityClipboardItem = utf8ToBase64(JSON.stringify(copyActionResult))

  const clipboardItem = new ClipboardItem({
    ...(SUPPORTS_SANITY_CLIPBOARD_MIMETYPE && {
      [MIMETYPE_SANITY_CLIPBOARD]: new Blob([JSON.stringify(copyActionResult)], {
        type: MIMETYPE_SANITY_CLIPBOARD,
      }),
    }),
    [MIMETYPE_HTML]: new Blob(
      // we store the data within a data attribute because safari will sanitize
      // and mangle the HTML written to the clipboard
      // https://stackoverflow.com/a/68958287/5776910
      [`<p data-${BASE64_ATTR}="${base64SanityClipboardItem}">${escapedTextValue}</p>`],
      {type: MIMETYPE_HTML},
    ),
    [MIMETYPE_PLAINTEXT]: new Blob([textValue], {type: MIMETYPE_PLAINTEXT}),
  })

  try {
    await navigator.clipboard.write([clipboardItem])
    return true
  } catch (error) {
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
    const el = doc.querySelector(`[data-${BASE64_ATTR}]`) as HTMLParagraphElement
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

function escapeHtml(text: string) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(text, 'text/html')
  return doc.documentElement.textContent
}

export function transformValueToText(value: unknown): string {
  if (!value) return ''
  if (isString(value)) return value
  if (Number.isFinite(value)) return value.toString()

  if (Array.isArray(value)) {
    return value.map(transformValueToText).filter(Boolean).join(', ')
  }

  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([key, subValue]) => (key.startsWith('_') ? '' : transformValueToText(subValue)))
      .filter(Boolean)
      .join(', ')
  }

  return ''
}

export function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (Array.isArray(value) && value.length === 0) return true
  return false
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
