import {useEffect, useRef, type RefObject} from 'react'

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

interface ActiveDialog {
  onClose: RefObject<() => void>
  onBackRequest: RefObject<(() => boolean) | undefined>
}

/**
 * The marker entry is global (there is one session history), so the state
 * that interprets pops of that entry must be global too. Were it per hook
 * instance, an unmounting dialog's programmatic `history.back()` could settle
 * after a new dialog instance mounted, and the new instance would mistake the
 * leftover popstate for the user pressing back and close itself.
 */
let activeDialog: ActiveDialog | null = null

/**
 * Counts our own programmatic `history.back()` calls (the unmount cleanup
 * removing the dialog's entry) so their popstate is not mistaken for the user
 * pressing back — regardless of which dialog instance (or none) is mounted
 * when the traversal settles.
 */
let suppressedPops = 0

let listening = false

function handlePopState(): void {
  if (suppressedPops > 0) {
    suppressedPops -= 1
    // Our own pop while a dialog is (still or again) open — restore the
    // entry. With no dialog mounted the entry's removal was the point.
    if (activeDialog && !hasMarker()) pushMarkerEntry()
    stopListeningWhenIdle()
    return
  }
  if (!activeDialog) return
  // The view handled the press internally (stepped back inside the picker):
  // restore the dialog's entry — which also truncates any forward entries —
  // and keep the dialog open.
  if (activeDialog.onBackRequest.current?.()) {
    if (!hasMarker()) pushMarkerEntry()
    return
  }
  activeDialog.onClose.current()
}

function startListening(): void {
  if (listening) return
  window.addEventListener('popstate', handlePopState)
  listening = true
}

/**
 * Keeps listening past unmount while a programmatic pop is pending, so the
 * pop is consumed when it settles instead of leaving a stale count that would
 * swallow a later dialog's first genuine back press.
 */
function stopListeningWhenIdle(): void {
  if (!listening || activeDialog || suppressedPops > 0) return
  window.removeEventListener('popstate', handlePopState)
  listening = false
}

/**
 * Makes browser back close the dialog instead of navigating the Studio
 * underneath it (the standard modal-history pattern).
 *
 * While enabled, one same-URL history entry represents "the dialog is open".
 * Popping it (the user pressing back) first offers the press to
 * `onBackRequest` — the mounted view stepping back through its own internal
 * history — and only calls `onClose` when the view has nothing to step back
 * to. Closing through any other path removes the entry again on unmount,
 * leaving the session history as it was before the dialog opened.
 *
 * This is only reliable because the federated picker shares the window and
 * runs on a memory-history router: nothing interleaves entries after the
 * dialog's own. The iframe fallback dialog is deliberately not covered — the
 * iframe's navigations join the tab's session history, so the same pattern
 * would race with them.
 *
 * @internal
 */
export function useHistoryBackClose(
  enabled: boolean,
  onClose: () => void,
  onBackRequest?: () => boolean,
): void {
  const onCloseRef = useRef(onClose)
  const onBackRequestRef = useRef(onBackRequest)
  useEffect(() => {
    onCloseRef.current = onClose
    onBackRequestRef.current = onBackRequest
  })

  useEffect(() => {
    if (!enabled) return undefined

    const dialog: ActiveDialog = {onClose: onCloseRef, onBackRequest: onBackRequestRef}
    activeDialog = dialog
    startListening()

    // A pending programmatic pop from a just-unmounted instance restores the
    // entry itself when it settles (see handlePopState), so only push when
    // the entry is genuinely absent.
    if (!hasMarker()) pushMarkerEntry()

    return () => {
      if (activeDialog === dialog) activeDialog = null
      // Closed by other means than back: remove the dialog's entry so a later
      // back press doesn't no-op. When back itself closed the dialog the
      // entry is already gone.
      if (hasMarker()) {
        suppressedPops += 1
        window.history.back()
      }
      stopListeningWhenIdle()
    }
  }, [enabled])
}
