import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {combineLatest, type Observable, of, timer} from 'rxjs'
import {distinctUntilChanged, map, startWith, switchMap} from 'rxjs/operators'

import {useDocumentStore} from '../store'
import {type ConnectionState, connectionState} from './useConnectionState'

/**
 * Staged "is this document syncing?" signal, derived from the document's
 * consistency state combined with the realtime connection state and whether
 * the latest commit attempt actually failed.
 *
 * - `synced`: no pending local mutations, or they're committing normally.
 *   This includes a slow-draining backlog: while the connection is live and
 *   no commit has failed, a document that stays unsynced for a while (e.g.
 *   sustained typing while the request pipeline is saturated) is not an
 *   error condition, and nothing is shown.
 * - `pending`: local mutations have been unsynced for a short while
 *   (`PENDING_AFTER_MS`) and we don't have a live connection. Non-blocking;
 *   the editor stays usable.
 * - `stalled`: still unsynced and disconnected past `STALLED_AFTER_MS` —
 *   the editor goes read-only to stop the user piling more edits onto a
 *   document that isn't reaching the server.
 * - `recovering`: unsynced past the pending floor, the connection is live,
 *   and the latest commit attempt *failed* — the mutator is retrying it on
 *   backoff. This covers both the flush right after a reconnect and a
 *   document-specific 5xx that retries while the listener stays perfectly
 *   connected. Editing stays locked (we're not in sync yet), but the
 *   message reassures the user that we're saving rather than telling them
 *   they're stuck. Entry is debounced by `RECOVERING_DEBOUNCE_MS`, so a
 *   failure whose retry promptly succeeds never shows at all; once shown,
 *   it clears the moment a retry succeeds or the backlog drains.
 *
 *   `recovering` is time-boxed: if we stay unsynced-and-failing for
 *   `RECOVERING_GRACE_MS`, the backlog clearly isn't draining (the mutator
 *   eventually stops retrying after ~200 attempts — see
 *   `BufferedDocument._cycleCommitter`), so we fall back to `stalled`
 *   rather than reassure the user indefinitely while nothing reaches the
 *   server.
 *
 * @internal
 */
export type DocumentSyncState = 'synced' | 'pending' | 'stalled' | 'recovering'

/** How long the document may stay unsynced before we warn (non-blocking). */
const PENDING_AFTER_MS = 10_000
/** How long before we escalate to a read-only lock. */
const STALLED_AFTER_MS = 30_000
/**
 * How long we keep reassuring (`recovering`) while connected and retrying a
 * failed commit, before concluding commits aren't getting through and
 * showing `stalled` instead.
 */
const RECOVERING_GRACE_MS = 10_000
/**
 * How long a commit failure must persist (while connected and past the
 * pending floor) before we show `recovering`. The mutator's retry backoff
 * is `commit.tries * 1000` (see `BufferedDocument._cycleCommitter`), so the
 * first two retries land at ~1s and ~3s after the failure — this gives both
 * a chance to succeed without the toast ever flashing for a transient
 * failure.
 */
const RECOVERING_DEBOUNCE_MS = 5_500

const INITIAL: DocumentSyncState = 'synced'

/** The pre-connection escalation: synced → pending → stalled over time. */
type UnsyncedStage = 'synced' | 'pending' | 'stalled'

/**
 * Maps the consistency stream (`true` = synced, `false` = unsynced local
 * mutations), the connection state, and the commit-failure stream (`true` =
 * the latest commit attempt failed and is being retried) to the staged
 * {@link DocumentSyncState}. Pure — extracted so the timing/combination
 * behavior can be unit-tested without the document store.
 *
 * @internal
 */
export function deriveDocumentSyncState(
  consistency$: Observable<boolean>,
  connectionState$: Observable<ConnectionState>,
  commitFailed$: Observable<boolean>,
): Observable<DocumentSyncState> {
  const stage$: Observable<UnsyncedStage> = consistency$.pipe(
    switchMap((isConsistent) => {
      // Consistent → synced. Becoming consistent again tears down any
      // escalation timer below (via switchMap), so recovery is automatic.
      if (isConsistent) return of<UnsyncedStage>('synced')

      // Unsynced. Stay 'synced' for PENDING_AFTER_MS so a normal
      // sub-second commit never flashes a warning, then escalate.
      return timer(PENDING_AFTER_MS, STALLED_AFTER_MS - PENDING_AFTER_MS).pipe(
        map((tick): UnsyncedStage => (tick === 0 ? 'pending' : 'stalled')),
        startWith<UnsyncedStage>('synced'),
      )
    }),
    distinctUntilChanged(),
  )

  // Whether the connection is live, collapsed to a boolean — we only care
  // about connected-vs-not here.
  const isConnected$ = connectionState$.pipe(
    map((connection) => connection === 'connected'),
    distinctUntilChanged(),
  )

  return combineLatest([stage$, isConnected$, commitFailed$.pipe(distinctUntilChanged())]).pipe(
    // Collapse the inputs to the underlying sync situation they describe —
    // the timing policy below (debounce, grace window) then maps it to the
    // presented DocumentSyncState.
    map(([stage, isConnected, commitFailed]) => {
      // Consistent, or a fresh unsynced period under the pending floor —
      // nothing to show.
      if (stage === 'synced') return 'synced'

      // Unsynced and not connected: the staged warning/lock. Disconnection
      // is a problem in itself — buffered edits can't reach the server —
      // so no commit-failure evidence is required here.
      if (!isConnected) return stage === 'pending' ? 'disconnected-pending' : 'disconnected-stalled'

      // Unsynced but connected. Only escalate when a commit actually
      // failed: a backlog that is merely slow to drain (commits succeeding
      // while the user keeps editing, or a saturated request pipeline)
      // must not warn — and certainly must not lock the editor.
      return commitFailed ? 'retrying' : 'synced'
    }),
    // Dropping identical consecutive values here is what keeps the
    // switchMap below from re-firing (and restarting its timers) on an
    // input change that maps to the same underlying state. While retrying,
    // the pending → stalled stage tick is such a no-op: without this it
    // would flap recovering ↔ stalled every time the stage timer ticks
    // underneath.
    distinctUntilChanged(),
    // switchMap (not map) because the retrying state is time-boxed.
    switchMap((state): Observable<DocumentSyncState> => {
      if (state === 'synced') return of<DocumentSyncState>('synced')

      if (state === 'disconnected-pending') return of<DocumentSyncState>('pending')

      if (state === 'disconnected-stalled') return of<DocumentSyncState>('stalled')

      // Connected, unsynced, and the latest commit failed. Hold the
      // previous state for a short debounce first — if the retry gets
      // through within it, nothing is ever shown. Then reassure
      // (`recovering`) for a grace window; if we're still
      // unsynced-and-failing when it fires, commits aren't landing — fall
      // back to `stalled` so we don't reassure indefinitely. (A successful
      // retry flips `commitFailed` off and a drained backlog flips the
      // stage to 'synced' — either tears these timers down via switchMap
      // before they fire.)
      return timer(RECOVERING_DEBOUNCE_MS).pipe(
        switchMap(() =>
          timer(RECOVERING_GRACE_MS).pipe(
            map((): DocumentSyncState => 'stalled'),
            startWith<DocumentSyncState>('recovering'),
          ),
        ),
      )
    }),
    startWith(INITIAL),
    distinctUntilChanged(),
  )
}

/** @internal */
export function useDocumentSyncState(
  publishedDocId: string,
  docTypeName: string,
  version?: string,
): DocumentSyncState {
  const documentStore = useDocumentStore()

  const observable = useMemo(
    () =>
      deriveDocumentSyncState(
        documentStore.pair.consistencyStatus(publishedDocId, docTypeName, version),
        connectionState(documentStore, publishedDocId, docTypeName, version),
        documentStore.pair
          .commitErrorStatus(publishedDocId, docTypeName, version)
          .pipe(map((commitError) => commitError !== undefined)),
      ),
    [docTypeName, documentStore, publishedDocId, version],
  )

  return useObservable(observable, INITIAL)
}
