import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {combineLatest, type Observable, of, timer} from 'rxjs'
import {distinctUntilChanged, map, startWith, switchMap} from 'rxjs/operators'

import {useDocumentStore} from '../store'
import {type ConnectionState, connectionState} from './useConnectionState'

/**
 * Staged "is this document syncing?" signal, derived from the document's
 * consistency state combined with the realtime connection state.
 *
 * - `synced`: no pending local mutations, or they're committing normally.
 * - `pending`: local mutations have been unsynced for a short while
 *   (`PENDING_AFTER_MS`) and we still don't have a live connection —
 *   a commit is failing/retrying. Non-blocking; the editor stays usable.
 * - `stalled`: still unsynced and disconnected past `STALLED_AFTER_MS` —
 *   the editor goes read-only to stop the user piling more edits onto a
 *   document that isn't reaching the server.
 * - `recovering`: still unsynced, but the connection is back — we're
 *   flushing the buffered backlog. Editing stays locked (we're not in
 *   sync yet), but the message reassures the user that submissions have
 *   resumed rather than telling them they're stuck. Clears to `synced`
 *   the moment the backlog drains.
 *
 *   `recovering` is time-boxed: a live realtime connection does not
 *   guarantee that *commits* are succeeding (a document-specific 5xx
 *   retries on backoff while the listener stays perfectly connected, and
 *   the mutator eventually stops retrying after ~200 attempts — see
 *   `BufferedDocument._cycleCommitter`). If we stay unsynced for
 *   `RECOVERING_GRACE_MS` after the connection returns, the backlog clearly
 *   isn't draining, so we fall back to `stalled` rather than reassure the
 *   user indefinitely while nothing reaches the server.
 *
 * @internal
 */
export type DocumentSyncState = 'synced' | 'pending' | 'stalled' | 'recovering'

/** How long the document may stay unsynced before we warn (non-blocking). */
const PENDING_AFTER_MS = 10_000
/** How long before we escalate to a read-only lock. */
const STALLED_AFTER_MS = 30_000
/**
 * How long we trust "connection is back" to mean "the backlog is flushing"
 * before concluding commits aren't actually getting through and showing
 * `stalled` instead. Kept short: a healthy backlog drains in well under a
 * second once the connection is live.
 */
const RECOVERING_GRACE_MS = 10_000

const INITIAL: DocumentSyncState = 'synced'

/** The pre-connection escalation: synced → pending → stalled over time. */
type UnsyncedStage = 'synced' | 'pending' | 'stalled'

/**
 * Maps the consistency stream (`true` = synced, `false` = unsynced local
 * mutations) and the connection state to the staged
 * {@link DocumentSyncState}. Pure — extracted so the timing/combination
 * behavior can be unit-tested without the document store.
 *
 * @internal
 */
export function deriveDocumentSyncState(
  consistency$: Observable<boolean>,
  connectionState$: Observable<ConnectionState>,
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

  // Whether the connection is live, collapsed to a boolean. We only care
  // about connected-vs-not here, and we must NOT let `stage` ticks
  // (pending → stalled) feed the connected branch's switchMap below, or its
  // grace timer would restart on every tick and flap recovering ↔ stalled.
  const isConnected$ = connectionState$.pipe(
    map((connection) => connection === 'connected'),
    distinctUntilChanged(),
  )

  return combineLatest([stage$, isConnected$]).pipe(
    // Collapse inputs that the branch logic treats identically, so the
    // switchMap below doesn't re-fire (and restart its grace timer) on a
    // change it would map to the same behavior. While connected, the
    // pending → stalled tick is such a no-op: the connected branch ignores
    // which stage we're in, so without this it would flap recovering ↔
    // stalled every time the stage timer ticks underneath.
    distinctUntilChanged(([prevStage, prevConn], [stage, conn]) => {
      if (prevConn !== conn) return false
      if (conn) return (prevStage === 'synced') === (stage === 'synced')
      return prevStage === stage
    }),
    // switchMap (not map) because the connected branch is time-boxed.
    switchMap(([stage, isConnected]): Observable<DocumentSyncState> => {
      // Still synced (or recovered) — nothing to show.
      if (stage === 'synced') return of<DocumentSyncState>('synced')

      // Unsynced and not connected: the staged warning/lock.
      if (!isConnected) return of<DocumentSyncState>(stage)

      // Unsynced AND the connection is back. For a short grace window we
      // assume the backlog is flushing and reassure (`recovering`). If it
      // hasn't drained by then, commits aren't getting through after all —
      // fall back to `stalled` so we don't reassure indefinitely. (When the
      // backlog *does* drain, consistency$ flips to `true`, stage becomes
      // 'synced', and switchMap tears this timer down before it fires.)
      return timer(RECOVERING_GRACE_MS).pipe(
        map((): DocumentSyncState => 'stalled'),
        startWith<DocumentSyncState>('recovering'),
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
      ),
    [docTypeName, documentStore, publishedDocId, version],
  )

  return useObservable(observable, INITIAL)
}
