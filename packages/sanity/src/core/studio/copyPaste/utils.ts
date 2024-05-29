import {type CopyActionResult} from 'sanity'

import {LS_RESULT_KEY} from './constants'

export const getLocalStorageItem = (key: string): CopyActionResult | null => {
  const item = localStorage.getItem(key)
  return item ? JSON.parse(item) : null
}

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

export const setLocalStorageItem = (key: string, value: CopyActionResult): void => {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getLocalStorageKey(projectId: string) {
  return `${LS_RESULT_KEY}:${projectId}`
}

export function isCopyPasteResult(value: any): value is CopyActionResult {
  const normalized = typeof value === 'string' ? parseCopyResult(value) : value

  return typeof normalized === 'object' && normalized?._type === 'copyResult'
}

export function parseCopyResult(value: any): CopyActionResult | null {
  try {
    return JSON.parse(value)
  } catch (_) {
    return null
  }
}
