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

import {getJsonStream} from '../../../../store/_legacy/history/history/getJsonStream'
import {type ReleasesReducerState} from '../../../store/reducer'
import {buildReleaseEditEvents} from './buildReleaseEditEvents'
import {type CreateReleaseEvent, type EditReleaseEvent} from './types'

const TRANSLOG_ENTRY_LIMIT = 100

const documentTransactionsCache: Record<string, TransactionLogEventWithEffects[]> =
  Object.create(null)

export async function getReleaseTransactions({
  documentId,
  client,
  toTransaction,
}: {
  documentId: string
  client: SanityClient
  toTransaction?: string
}): Promise<TransactionLogEventWithEffects[]> {
  const cacheKey = `${documentId}`
  let fromTransaction: string | undefined
  const cachedTransactions = documentTransactionsCache[cacheKey] || []
  if (cachedTransactions.length > 0) {
    if (cachedTransactions[0].id === toTransaction) {
      return cachedTransactions
    }
    // Assign the last cached transaction as the from, we can use that as the entry point in the translog and not fetch unnecessary elements.
    fromTransaction = cachedTransactions[0].id
  }
  const clientConfig = client.config()
  const dataset = clientConfig.dataset

  const queryParams = new URLSearchParams({
    tag: 'sanity.studio.release.history',
    effectFormat: 'mendoza',
    excludeContent: 'true',
    includeIdentifiedDocumentsOnly: 'true',
    limit: TRANSLOG_ENTRY_LIMIT.toString(),
    reverse: 'true',
  })
  if (fromTransaction) {
    queryParams.append('fromTransaction', fromTransaction)
  }
  if (toTransaction) {
    queryParams.append('toTransaction', toTransaction)
  }

  const transactionsUrl = client.getUrl(
    `/data/history/${dataset}/transactions/${documentId}?${queryParams.toString()}`,
  )
  const transactions: TransactionLogEventWithEffects[] = []

  const stream = await getJsonStream(transactionsUrl, clientConfig.token)
  const reader = stream.getReader()
  let count = 0
  for (;;) {
    // eslint-disable-next-line no-await-in-loop
    const result = await reader.read()
    if (result.done) break

    if ('error' in result.value) {
      throw new Error(result.value.error.description || result.value.error.type)
    }
    transactions.push(result.value)
    count++
  }
  if (count === TRANSLOG_ENTRY_LIMIT) {
    //   // We have received the max values, we need to fetch the next batch.
    //   // TODO: Validate this loading more
    //   const nextTransactions = await getReleaseTransactions({
    //     documentId,
    //     client,
    //     toTransaction: transactions[transactions.length - 1].id,
    //   })
    //   return transactions.concat(nextTransactions)
    // }
  }

  documentTransactionsCache[cacheKey] = transactions.concat(
    cachedTransactions.filter(
      (cached) => !transactions.find((transaction) => transaction.id === cached.id),
    ),
  )
  return documentTransactionsCache[cacheKey]
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
      editEvents$: of({editEvents: [], loading: false}),
    }
  }
  let lastRevProcessed = ''
  return {
    editEvents$: releasesState$.pipe(
      map((releasesState) => releasesState.releases.get(releaseId)),
      // Remove the undefined releases
      filter(Boolean),
      // ReleaseState$ is changing a lot, we only need to update this if the `_rev` changes
      filter((release) => lastRevProcessed !== release._rev),
      tap((release) => {
        lastRevProcessed = release._rev
      }),
      switchMap((release) => {
        return from(
          getReleaseTransactions({
            client,
            documentId: releaseId,
            toTransaction: release?._rev,
          }),
        ).pipe(
          map((transactions) => {
            return {editEvents: buildReleaseEditEvents(transactions, release), loading: false}
          }),
          startWith(EDITS_EVENTS_INITIAL_VALUE),
        )
      }),
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
