import {supportsLocalStorage} from '../util/supportsLocalStorage'

/**
 * @todo Rework to use settings store
 */

const LOCAL_STORAGE_PREFIX = 'sanity-locale'

/**
 * Get the users' preferred locale, if any
 *
 * @param workspaceName - Workspace name to segment on
 * @returns Locale identifier, or `undefined`
 * @internal
 */
export function getPreferredLocale(workspaceName: string): string | undefined {
  if (!supportsLocalStorage) {
    return undefined
  }
  const locale = localStorage.getItem(getItemKey(workspaceName))
  return locale ?? undefined
}

/**
 * Store the users' preferred locale
 *
 * @param projectId - Project ID to segment on
 * @param sourceId - Source ID to segment on
 * @param locale - Locale to store
 * @returns
 * @internal
 */
export function storePreferredLocale(workspaceName: string, locale: string): void {
  if (!supportsLocalStorage) {
    return
  }
  localStorage.setItem(getItemKey(workspaceName), locale)
}

/**
 * Get the key used to store the setting in localStorage
 *
 * @param projectId - Project ID to segment on
 * @param sourceId - Source ID to segment on
 * @returns Storage key
 * @internal
 */
function getItemKey(workspaceName: string) {
  return [LOCAL_STORAGE_PREFIX, workspaceName].join(':')
}
