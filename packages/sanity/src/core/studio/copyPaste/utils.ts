import {isFinite} from 'lodash'
import {isString} from 'sanity'

import {type CopyActionResult} from './types'

export const getClipboardItem = async (): Promise<CopyActionResult | null> => {
  const value = await window.navigator.clipboard.readText().then((text) => {
    return parseCopyResult(text)
  })

  if (!isCopyPasteResult(value)) {
    return null
  }

  return value
}

export const writeClipboardItem = (value: CopyActionResult): void => {
  window.navigator.clipboard.writeText(JSON.stringify(value))
}

export function isCopyPasteResult(value: any): value is CopyActionResult {
  const normalized = typeof value === 'string' ? parseCopyResult(value) : value

  return typeof normalized === 'object' && normalized?._type === 'copyResult'
}

export function transformValueToPrimitive(value: CopyActionResult | null): string | number {
  const {docValue} = value || {}

  if (isString(docValue)) {
    return docValue
  }

  if (isFinite(docValue)) {
    return Number(docValue)
  }

  if (isString(docValue) && isFinite(parseFloat(docValue))) {
    return parseFloat(docValue)
  }

  return docValue || ''
}

export function parseCopyResult(value: any): CopyActionResult | null {
  try {
    return JSON.parse(value)
  } catch (_) {
    return null
  }
}

export function isSelectionWithinInputElement(element: HTMLElement | EventTarget | null): boolean {
  const activeElement = document.activeElement as HTMLElement

  // Check if the active element is a textarea or input
  if (
    activeElement &&
    (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT')
  ) {
    const inputElement = activeElement as HTMLInputElement | HTMLTextAreaElement

    // Check if there is a text selection within the input/textarea element
    if (inputElement.selectionStart !== null && inputElement.selectionEnd !== null) {
      return inputElement.selectionStart !== inputElement.selectionEnd
    }
  }

  return false
}

export function isInputElement(
  element: any | HTMLElement | null,
): element is HTMLInputElement | HTMLTextAreaElement {
  return element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement
}

export function insertTextAtCursor(element: HTMLInputElement | HTMLTextAreaElement, text: string) {
  const start = element.selectionStart || 0
  const end = element.selectionEnd || 0
  const value = element.value

  // React will override the native input value setter
  const nativeInputValueSetter = getNativeInputValueSetter()

  nativeInputValueSetter?.call(element, value.slice(0, start) + text + value.slice(end))
  element.selectionStart = start
  element.selectionEnd = start + text.length

  const changeEvent = new Event('input', {bubbles: true})
  element.dispatchEvent(changeEvent)
}

/**
 * Get the native input value setter function
 */
function getNativeInputValueSetter() {
  if (!window || !window.HTMLInputElement || !Object) {
    return null
  }

  return Object.getOwnPropertyDescriptor(window?.HTMLInputElement?.prototype, 'value')?.set
}
