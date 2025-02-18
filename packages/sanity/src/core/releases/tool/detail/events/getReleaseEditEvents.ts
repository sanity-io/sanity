import {type SanityClient} from '@sanity/client'
import {type TransactionLogEventWithEffects} from '@sanity/types'
import {
  catchError,
  distinctUntilChanged,
  expand,
  filter,
  from,
  map,
  type Observable,
  of,
  reduce,
  scan,
  shareReplay,
  startWith,
  switchMap,
  tap,
} from 'rxjs'

import {getTransactionsLogs} from '../../../../store/translog/getTransactionsLogs'
import {type ReleaseDocument} from '../../../store/types'
import {buildReleaseEditEvents} from './buildReleaseEditEvents'
import {type ReleaseEvent} from './types'

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

/**
 * This will fetch all the transactions for a given release.
 * I anticipate this would be a rather small number of transactions, given the release document is "small" and shouldn't change much.
 *
 * We need to fetch all of them to create the correct pagination of events in the activity feed, given we need to combine this with the
 * releaseActivityEvents that will be fetched from the events api.
 */
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

  function fetchLogs(options: {
    fromTransaction?: string
    toTransaction: string
  }): Observable<TransactionLogEventWithEffects[]> {
    return from(
      getTransactionsLogs(client, documentId, {
        tag: 'sanity.studio.release.history',
        effectFormat: 'mendoza',
        limit: TRANSLOG_ENTRY_LIMIT,
        reverse: true,
        fromTransaction: options.fromTransaction,
        toTransaction: options.toTransaction,
      }),
    )
  }

  return fetchLogs({fromTransaction: cachedTransactions[0]?.id, toTransaction: toTransaction})
    .pipe(
      expand((response) => {
        // Fetch more if the transactions length is equal to the limit
        if (response.length === TRANSLOG_ENTRY_LIMIT) {
          // Continue fetching if nextCursor exists, we use the last transaction received as the cursor.
          return fetchLogs({
            fromTransaction: undefined,
            toTransaction: response[response.length - 1].id,
          })
        }
        // End recursion by emitting an empty observable
        return of()
      }),
      // Combine all batches of transactions into a single array
      reduce(
        (allTransactions, batch) => allTransactions.concat(batch),
        [] as TransactionLogEventWithEffects[],
      ),
    )
    .pipe(
      map((transactions) => removeDupes(transactions, cachedTransactions)),
      tap((transactions) => {
        documentTransactionsCache[cacheKey] = transactions
      }),
    )
}

interface EditEventsObservableValue {
  editEvents: ReleaseEvent[]
  loading: boolean
  error: null | Error
}
export const INITIAL_VALUE: EditEventsObservableValue = {
  editEvents: [],
  loading: true,
  error: null,
}

interface getReleaseActivityEventsOpts {
  client: SanityClient
  observeDocument$: Observable<ReleaseDocument | undefined>
}

export function getReleaseEditEvents({
  client,
  observeDocument$,
}: getReleaseActivityEventsOpts): Observable<EditEventsObservableValue> {
  return observeDocument$.pipe(
    filter(Boolean),
    distinctUntilChanged((prev, next) => prev._rev === next._rev),
    switchMap((release) => {
      return getReleaseTransactions({
        client,
        documentId: release._id,
        toTransaction: release._rev,
      }).pipe(
        map((transactions) => {
          return {
            editEvents: buildReleaseEditEvents(transactions, release),
            loading: false,
            error: null,
          }
        }),
        catchError((error) => {
          console.error(error)
          return of({editEvents: [], loading: false, error})
        }),
      )
    }),
    startWith(INITIAL_VALUE),
    scan((acc, current) => {
      // Accumulate edit events from previous state
      const editEvents = current.loading
        ? acc.editEvents // Preserve previous events while loading
        : current.editEvents // Update with new events when available

      return {...current, editEvents}
    }, INITIAL_VALUE),
    shareReplay(1),
  )
}
