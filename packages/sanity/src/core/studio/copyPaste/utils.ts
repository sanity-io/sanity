import {type CopyActionResult} from 'sanity'

import {LS_RESULT_KEY} from './constants'

export const getLocalStorageItem = (key: string): CopyActionResult | null => {
  const item = localStorage.getItem(key)
  return item ? JSON.parse(item) : null
}

export const setLocalStorageItem = (key: string, value: CopyActionResult): void => {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getLocalStorageKey(projectId: string) {
  return `${LS_RESULT_KEY}:${projectId}`
}
