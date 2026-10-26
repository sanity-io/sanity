import {useEffect, useRef} from 'react'

/**
 * Marks the dialog's own history entry. Lives on `history.state` rather than
 * in the URL so the address bar never changes while the dialog is open.
 */
const HISTORY_MARKER = '__sanityFederatedAssetSourceDialog'

function hasMarker(): boolean {
  const state: unknown = window.history.state
  return typeof state === 'object' && state !== null && HISTORY_MARKER in state
}

function pushMarkerEntry(): void {
  // Spread the current entry's state so the router's own history bookkeeping
  // (the `history` package's `{usr, key, idx}` shape) stays readable while
  // the dialog's entry is on top of the stack.
  window.history.pushState({...window.history.state, [HISTORY_MARKER]: true}, '')
}

/**
 * Makes browser back close the dialog instead of navigating the Studio
 * underneath it (the standard modal-history pattern).
 *
 * While enabled, one same-URL history entry represents "the dialog is open".
 * Popping it (the user pressing back) calls `onClose`; closing through any
 * other path removes the entry again on unmount, leaving the session history
 * as it was before the dialog opened.
 *
 * This is only reliable because the federated picker shares the window and
 * runs on a memory-history router: nothing interleaves entries after the
 * dialog's own. The iframe fallback dialog is deliberately not covered — the
 * iframe's navigations join the tab's session history, so the same pattern
 * would race with them.
 *
 * @internal
 */
export function useHistoryBackClose(enabled: boolean, onClose: () => void): void {
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  // Counts our own programmatic `history.back()` calls (the unmount cleanup
  // removing the dialog's entry) so their popstate is not mistaken for the
  // user pressing back. Shared across effect runs so a StrictMode remount
  // consumes the cleanup's pending pop and restores the entry instead of
  // closing the freshly opened dialog.
  const suppressedPopsRef = useRef(0)

  useEffect(() => {
    if (!enabled) return undefined

    if (!hasMarker()) pushMarkerEntry()

    const handlePopState = () => {
      if (suppressedPopsRef.current > 0) {
        suppressedPopsRef.current -= 1
        // Our own pop while the dialog is still open — restore the entry.
        if (!hasMarker()) pushMarkerEntry()
        return
      }
      onCloseRef.current()
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
      // Closed by other means than back: remove the dialog's entry so a later
      // back press doesn't no-op. When back itself closed the dialog the
      // entry is already gone.
      if (hasMarker()) {
        suppressedPopsRef.current += 1
        window.history.back()
      }
    }
  }, [enabled])
}
