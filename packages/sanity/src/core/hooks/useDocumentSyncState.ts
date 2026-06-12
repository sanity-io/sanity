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
 * @internal
 */
export type DocumentSyncState = 'synced' | 'pending' | 'stalled' | 'recovering'

/** How long the document may stay unsynced before we warn (non-blocking). */
const PENDING_AFTER_MS = 10_000
/** How long before we escalate to a read-only lock. */
const STALLED_AFTER_MS = 30_000

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

  return combineLatest([stage$, connectionState$]).pipe(
    map(([stage, connection]): DocumentSyncState => {
      // Still synced (or recovered) — nothing to show.
      if (stage === 'synced') return 'synced'
      // Unsynced AND the connection is back: we're flushing the backlog,
      // not stuck. Reassure rather than alarm.
      if (connection === 'connected') return 'recovering'
      // Unsynced and not connected: the staged warning/lock.
      return stage
    }),
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
