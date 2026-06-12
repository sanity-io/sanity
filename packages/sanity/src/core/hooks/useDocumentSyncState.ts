import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {type Observable, of, timer} from 'rxjs'
import {distinctUntilChanged, map, startWith, switchMap} from 'rxjs/operators'

import {useDocumentStore} from '../store'

/**
 * Staged "is this document syncing?" signal derived from the document's
 * consistency state.
 *
 * - `synced`: no pending local mutations, or they're committing normally.
 * - `pending`: local mutations have been unsynced for a short while
 *   (`PENDING_AFTER_MS`) — a commit is failing/retrying. Non-blocking;
 *   the editor stays usable.
 * - `stalled`: local mutations have been unsynced for longer
 *   (`STALLED_AFTER_MS`) — the editor should go read-only to stop the
 *   user piling more edits onto a document that isn't reaching the
 *   server.
 *
 * The mutator keeps retrying failed commits with backoff, so this
 * recovers on its own: the moment the document becomes consistent again,
 * the state returns to `synced`.
 *
 * @internal
 */
export type DocumentSyncState = 'synced' | 'pending' | 'stalled'

/** How long the document may stay unsynced before we warn (non-blocking). */
const PENDING_AFTER_MS = 10_000
/** How long before we escalate to a read-only lock. */
const STALLED_AFTER_MS = 30_000

const INITIAL: DocumentSyncState = 'synced'

/**
 * Maps a consistency stream (`true` = synced, `false` = unsynced local
 * mutations) to the staged {@link DocumentSyncState}. Pure — extracted so
 * the timing behavior can be unit-tested without the document store.
 *
 * @internal
 */
export function deriveDocumentSyncState(
  consistency$: Observable<boolean>,
): Observable<DocumentSyncState> {
  return consistency$.pipe(
    switchMap((isConsistent) => {
      // Consistent → synced. Becoming consistent again tears down any
      // pending escalation timer below (via switchMap), so recovery is
      // automatic.
      if (isConsistent) return of<DocumentSyncState>('synced')

      // Unsynced. Stay 'synced' for PENDING_AFTER_MS so a normal
      // sub-second commit never flashes a warning, then escalate:
      // pending at PENDING_AFTER_MS, stalled at STALLED_AFTER_MS.
      return timer(PENDING_AFTER_MS, STALLED_AFTER_MS - PENDING_AFTER_MS).pipe(
        map((tick): DocumentSyncState => (tick === 0 ? 'pending' : 'stalled')),
        startWith<DocumentSyncState>('synced'),
      )
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
      ),
    [docTypeName, documentStore.pair, publishedDocId, version],
  )

  return useObservable(observable, INITIAL)
}
