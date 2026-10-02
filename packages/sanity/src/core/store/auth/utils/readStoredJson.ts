import {supportsLocalStorage} from '../../../util/supportsLocalStorage'

/**
 * The parsed JSON value under `key` in localStorage, or `undefined`. Never throws.
 *
 * @internal
 */
export function readStoredJson(key: string): unknown {
  if (!supportsLocalStorage) return undefined
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as unknown) : undefined
  } catch {
    return undefined
  }
}
