import {type SanityClient} from '@sanity/client'
import {type SanityDocument, type TransactionLogEventWithEffects} from '@sanity/types'
import {applyPatch} from 'mendoza'
import {
  catchError,
  combineLatest,
  filter,
  from,
  map,
  type Observable,
  of,
  shareReplay,
  startWith,
  take,
} from 'rxjs'

import {type ObjectDiff} from '../../field/types'
import {calculateDiff} from './calculateDiff'
import {getDocumentAtRevision} from './getDocumentAtRevision'
import {getDocumentTransactions} from './getDocumentTransactions'

/** @internal */
export interface EditChanges {
  loading: boolean
  diff: ObjectDiff | null
  error: Error | null
}

type DocumentContent = Partial<SanityDocument> | null

interface FetchedRange {
  transactions: TransactionLogEventWithEffects[]
  /** The document content before each of the `transactions`, at the same index. */
  contentBefore: DocumentContent[]
}

const LOADING: EditChanges = {loading: true, diff: null, error: null}

/** The fields `buildDocumentForDiffInput` leaves out of a diff, which `calculateDiff` keeps. */
const SYSTEM_FIELDS = new Set(['_id', '_type', '_createdAt', '_updatedAt'])

/**
 * Fetches the transactions from `fromRevisionId` to `toRevisionId`, both included (the translog
 * leaves the first one out of a range, so it is fetched on its own).
 */
async function getTransactionsIncludingFirst({
  client,
  documentId,
  fromRevisionId,
  toRevisionId,
}: {
  client: SanityClient
  documentId: string
  fromRevisionId: string
  toRevisionId: string
}): Promise<TransactionLogEventWithEffects[]> {
  const [first, rest] = await Promise.all([
    getDocumentTransactions({
      client,
      documentId,
      fromTransaction: fromRevisionId,
      toTransaction: fromRevisionId,
    }),
    fromRevisionId === toRevisionId
      ? Promise.resolve([])
      : getDocumentTransactions({
          client,
          documentId,
          fromTransaction: fromRevisionId,
          toTransaction: toRevisionId,
        }),
  ])
  return [...first, ...rest]
}

/**
 * Leaves the system fields out of a diff, so a transaction that only touched them (e.g.
 * `_updatedAt`) has no changes.
 */
function omitSystemFields(diff: ObjectDiff): ObjectDiff {
  const fields = Object.fromEntries(
    Object.entries(diff.fields).filter(([key]) => !SYSTEM_FIELDS.has(key)),
  )
  if (Object.values(fields).some((field) => field.isChanged)) {
    return {...diff, fields}
  }
  return {
    type: 'object',
    action: 'unchanged',
    isChanged: false,
    fields,
    fromValue: diff.fromValue ?? {},
    toValue: diff.toValue ?? {},
  }
}

/**
 * Diffs the document before the transaction at `fromIndex` of a range with the document after
 * replaying the transactions up to `toIndex`, attributing every change to the transaction that
 * made it.
 */
function diffTransactions({
  documentId,
  range,
  fromIndex,
  toIndex,
}: {
  documentId: string
  range: FetchedRange
  fromIndex: number
  toIndex: number
}): ObjectDiff {
  return omitSystemFields(
    calculateDiff({
      documentId,
      initialDoc: range.contentBefore[fromIndex] ?? {},
      transactions: range.transactions.slice(fromIndex, toIndex + 1),
      events: [],
    }),
  )
}

function diffWithinRanges({
  ranges,
  documentId,
  fromRevisionId,
  toRevisionId,
}: {
  ranges: FetchedRange[]
  documentId: string
  fromRevisionId: string
  toRevisionId: string
}): ObjectDiff | null {
  for (const range of ranges) {
    const fromIndex = range.transactions.findIndex(({id}) => id === fromRevisionId)
    const toIndex = range.transactions.findIndex(({id}) => id === toRevisionId)
    if (fromIndex !== -1 && toIndex >= fromIndex) {
      return diffTransactions({documentId, range, fromIndex, toIndex})
    }
  }
  return null
}

/**
 * Creates the `getEditChanges` function of an events store, which emits the changes made by the
 * edit transactions from `fromRevisionId` to `toRevisionId` (both included), e.g. the
 * transactions of an edit event, for a condensed view of what it changed.
 *
 * The document before the first transaction isn't addressable by a revision, so it is rebuilt from
 * the document at `toRevisionId` by reverting the transactions newest first. The transactions are
 * then replayed on top of it, as in `calculateDiff`, so every change is annotated with the author
 * and timestamp of the transaction that made it.
 *
 * Every range fetched is kept, with the document content before each of its transactions, so the
 * changes of any range within it (one listed transaction of a group whose changes were already
 * shown) are computed without fetching anything. Ranges being fetched are shared between
 * subscribers.
 *
 * Emits `loading` first, and an `error` when the document at `toRevisionId` can't be fetched (e.g.
 * history retention) or the transactions can't be fetched; failed ranges are fetched again on the
 * next call.
 */
export function createEditChanges({
  client,
  documentId,
}: {
  client: SanityClient
  documentId: string
}) {
  const ranges: FetchedRange[] = []
  const pendingRanges = new Map<string, Observable<EditChanges>>()

  const fetchRange = (fromRevisionId: string, toRevisionId: string): Observable<EditChanges> => {
    const after$ = getDocumentAtRevision({client, documentId, revisionId: toRevisionId}).pipe(
      filter((after) => !after?.loading),
      take(1),
    )
    const transactions$ = from(
      getTransactionsIncludingFirst({client, documentId, fromRevisionId, toRevisionId}),
    )

    return combineLatest([after$, transactions$]).pipe(
      map(([after, transactions]): EditChanges => {
        if (!after?.document) {
          return {
            loading: false,
            diff: null,
            error: new Error(`Missing document for revision ${toRevisionId}`),
          }
        }
        if (transactions.length === 0) {
          return {
            loading: false,
            diff: null,
            error: new Error(`Missing transactions for revision ${fromRevisionId}`),
          }
        }
        // The effects apply to the document without its revision, as in `calculateDiff`. The
        // transactions of the range are all the ones of the document, so the content before one
        // is the content after the previous one.
        const {_rev, ...afterContent} = after.document
        const contentBefore: DocumentContent[] = []
        let content: DocumentContent = afterContent
        for (let index = transactions.length - 1; index >= 0; index--) {
          const effect = transactions[index].effects[documentId]
          content = effect ? applyPatch(content, effect.revert) : content
          contentBefore[index] = content
        }
        const range = {transactions, contentBefore}
        ranges.push(range)
        return {
          loading: false,
          error: null,
          diff: diffTransactions({
            documentId,
            range,
            fromIndex: 0,
            toIndex: transactions.length - 1,
          }),
        }
      }),
      startWith(LOADING),
      catchError((error: Error) => of({loading: false, diff: null, error})),
    )
  }

  return function getEditChanges({
    fromRevisionId,
    toRevisionId,
  }: {
    fromRevisionId: string
    toRevisionId: string
  }): Observable<EditChanges> {
    const diff = diffWithinRanges({ranges, documentId, fromRevisionId, toRevisionId})
    if (diff) {
      return of({loading: false, error: null, diff})
    }
    const key = `${fromRevisionId}:${toRevisionId}`
    const pending = pendingRanges.get(key)
    if (pending) return pending

    const changes$ = fetchRange(fromRevisionId, toRevisionId).pipe(
      map((changes) => {
        if (!changes.loading) pendingRanges.delete(key)
        return changes
      }),
      shareReplay({bufferSize: 1, refCount: true}),
    )
    pendingRanges.set(key, changes$)
    return changes$
  }
}
