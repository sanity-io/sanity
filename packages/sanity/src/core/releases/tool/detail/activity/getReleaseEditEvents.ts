import {type SanityClient} from '@sanity/client'
import {type TransactionLogEventWithEffects} from '@sanity/types'
import {
  filter,
  from,
  map,
  type Observable,
  of,
  scan,
  shareReplay,
  startWith,
  switchMap,
  tap,
} from 'rxjs'

import {getTransactionsLogs} from '../../../../store/translog/getTransactionLogs'
import {type ReleasesReducerState} from '../../../store/reducer'
import {buildReleaseEditEvents} from './buildReleaseEditEvents'
import {type CreateReleaseEvent, type EditReleaseEvent} from './types'

const TRANSLOG_ENTRY_LIMIT = 100

const documentTransactionsCache: Record<string, TransactionLogEventWithEffects[]> =
  Object.create(null)

function removeDupes(
  newTransactions: TransactionLogEventWithEffects[],
  oldTransactions: TransactionLogEventWithEffects[],
) {
  const seen = new Set()
  return newTransactions.concat(oldTransactions).filter((transaction) => {
    if (seen.has(transaction.id)) {
      return false
    }
    seen.add(transaction.id)
    return true
  })
}

function getReleaseTransactions({
  documentId,
  client,
  toTransaction,
}: {
  documentId: string
  client: SanityClient
  toTransaction: string
}): Observable<TransactionLogEventWithEffects[]> {
  const cacheKey = `${documentId}`
  const cachedTransactions = documentTransactionsCache[cacheKey] || []
  if (cachedTransactions.length > 0 && cachedTransactions[0].id === toTransaction) {
    return of(cachedTransactions)
  }

  return from(
    getTransactionsLogs(client, documentId, {
      tag: 'sanity.studio.release.history',
      effectFormat: 'mendoza',
      limit: TRANSLOG_ENTRY_LIMIT,
      reverse: true,
      fromTransaction: cachedTransactions[0]?.id,
      toTransaction,
    }),
  ).pipe(
    // TODO: Add a load more
    map((transactions) => removeDupes(transactions, cachedTransactions)),
    tap((transactions) => {
      documentTransactionsCache[cacheKey] = transactions
    }),
  )
}

interface getReleaseActivityEventsOpts {
  client: SanityClient
  releaseId?: string
  releasesState$: Observable<ReleasesReducerState>
}
export const EDITS_EVENTS_INITIAL_VALUE: {
  editEvents: (EditReleaseEvent | CreateReleaseEvent)[]
  loading: boolean
} = {
  editEvents: [],
  loading: true,
}
export function getReleaseEditEvents({
  client,
  releaseId,
  releasesState$,
}: getReleaseActivityEventsOpts): {
  editEvents$: Observable<{
    editEvents: (EditReleaseEvent | CreateReleaseEvent)[]
    loading: boolean
  }>
} {
  if (!releaseId) {
    return {
      editEvents$: of({editEvents: [], loading: true}),
    }
  }
  let lastRevProcessed = ''
  return {
    editEvents$: releasesState$.pipe(
      map((releasesState) => releasesState.releases.get(releaseId)),
      // Don't emit if the release is not found
      filter(Boolean),
      // ReleaseState$ is changing a lot and it could change because of other releases changing, we only need to update this if the `_rev` changes
      filter((release) => lastRevProcessed !== release._rev),
      tap((release) => {
        lastRevProcessed = release._rev
      }),
      switchMap((release) => {
        return getReleaseTransactions({
          client,
          documentId: releaseId,
          toTransaction: release._rev,
        }).pipe(
          map((transactions) => {
            return {editEvents: buildReleaseEditEvents(transactions, release), loading: false}
          }),
        )
      }),
      startWith(EDITS_EVENTS_INITIAL_VALUE),
      scan((acc, current) => {
        // Accumulate edit events from previous state
        const editEvents = current.loading
          ? acc.editEvents // Preserve previous events while loading
          : current.editEvents // Update with new events when available

        return {...current, editEvents}
      }, EDITS_EVENTS_INITIAL_VALUE),
      shareReplay(1),
    ),
  }
}
