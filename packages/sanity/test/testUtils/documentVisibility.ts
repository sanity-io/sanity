import {vi} from 'vitest'

/**
 * Stubs `document.visibilityState`. `set` changes it and dispatches `visibilitychange`, the way a
 * browser does when a tab is hidden or shown. Undone by `vi.restoreAllMocks()`.
 */
export function stubDocumentVisibility(initial: DocumentVisibilityState = 'visible') {
  let visibility = initial
  vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility)
  return {
    set: (next: DocumentVisibilityState) => {
      visibility = next
      document.dispatchEvent(new Event('visibilitychange'))
    },
  }
}
