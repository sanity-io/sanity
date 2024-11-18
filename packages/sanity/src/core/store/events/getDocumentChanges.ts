import {diffInput, wrap} from '@sanity/diff'
import {type SanityDocument, type TransactionLogEventWithEffects} from '@sanity/types'
import {from, map, type Observable, of, startWith} from 'rxjs'
import {type SanityClient} from 'sanity'

import {type ObjectDiff} from '../../field'
import {getJsonStream} from '../_legacy/history/history/getJsonStream'
import {calculateDiff} from './reconstruct'
import {type DocumentGroupEvent} from './types'

const TRANSLOG_ENTRY_LIMIT = 50

const buildDocumentForDiffInput = (document?: Partial<SanityDocument> | null) => {
  if (!document) return {}
  // Remove internal fields and undefined values
  const {_id, _rev, _createdAt, _updatedAt, _type, _version, ...rest} = JSON.parse(
    JSON.stringify(document),
  )

  return rest
}

const documentTransactionsCache: Record<string, TransactionLogEventWithEffects[]> =
  Object.create(null)

async function getDocumentTransactions({
  documentId,
  client,
  toTransaction,
  fromTransaction,
}: {
  documentId: string
  client: SanityClient
  toTransaction: string
  fromTransaction: string
}) {
  const cacheKey = `${documentId}-${toTransaction}-${fromTransaction}`
  if (documentTransactionsCache[cacheKey]) {
    return documentTransactionsCache[cacheKey]
  }
  const clientConfig = client.config()
  const dataset = clientConfig.dataset

  const queryParams = new URLSearchParams({
    tag: 'sanity.studio.documents.history',
    effectFormat: 'mendoza',
    excludeContent: 'true',
    includeIdentifiedDocumentsOnly: 'true',
    // reverse: 'true',
    limit: TRANSLOG_ENTRY_LIMIT.toString(),
    // https://www.sanity.io/docs/history-api#toTransaction-d28ec5b5ff40
    toTransaction: toTransaction,
    // https://www.sanity.io/docs/history-api#fromTransaction-db53ef83c809
    fromTransaction: fromTransaction,
  })
  const transactionsUrl = client.getUrl(
    `/data/history/${dataset}/transactions/${documentId}?${queryParams.toString()}`,
  )
  const transactions: TransactionLogEventWithEffects[] = []

  const stream = await getJsonStream(transactionsUrl, clientConfig.token)
  const reader = stream.getReader()
  for (;;) {
    // eslint-disable-next-line no-await-in-loop
    const result = await reader.read()
    if (result.done) break

    if ('error' in result.value) {
      throw new Error(result.value.error.description || result.value.error.type)
    }
    if (result.value.id === fromTransaction) continue
    else transactions.push(result.value)
  }
  documentTransactionsCache[cacheKey] = transactions
  return transactions
}

export function getDocumentChanges({
  events,
  documentId,
  client,
  to,
  since,
}: {
  events: DocumentGroupEvent[]
  documentId: string
  client: SanityClient
  to: SanityDocument
  since: SanityDocument | null
}): Observable<{loading: boolean; diff: ObjectDiff | null}> {
  // Extremely raw implementation to get the differences between two versions.
  // Transactions could be cached, given they are not gonna change EVER.
  // We could also cache the diff, given it's not gonna change either
  // Transactions are in an order, so if we have [rev4, rev3, rev2] and we already got [rev4, rev3] we can just get the diff between rev3 and rev2 and increment it.
  // We need to expose this differently, as we need to also expose the transactions for versions and drafts, this implementation only works for published.
  // We need to find a way to listen to the incoming transactions and in the case of published documents, refetch the events when a new transaction comes in.
  // For versions and drafts we can keep the list of transactions updated just by the received transactions.
  if (!since) {
    return of({loading: false, diff: null})
  }

  return from(
    getDocumentTransactions({
      documentId,
      client,
      toTransaction: to._rev,
      fromTransaction: since._rev,
    }),
  ).pipe(
    map((transactions) => {
      return {
        loading: false,
        diff: calculateDiff({
          initialDoc: since,
          finalDoc: to,
          transactions,
          events: events,
        }) as ObjectDiff,
      }
    }),
    startWith({
      loading: true,
      diff: diffInput(
        wrap(buildDocumentForDiffInput(since), null),
        wrap(buildDocumentForDiffInput(to), null),
      ) as ObjectDiff,
    }),
  )
}
