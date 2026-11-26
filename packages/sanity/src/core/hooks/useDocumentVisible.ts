import {useSyncExternalStore} from 'react'

function subscribe(onStoreChange: () => void) {
  document.addEventListener('visibilitychange', onStoreChange)
  return () => document.removeEventListener('visibilitychange', onStoreChange)
}

function getSnapshot() {
  return document.visibilityState !== 'hidden'
}

function getServerSnapshot() {
  return true
}

/**
 * Whether the page is visible, as opposed to in a background tab or a minimized window.
 *
 * @internal
 */
export function useDocumentVisible(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
