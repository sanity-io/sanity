import {type SanityClient} from '@sanity/client'
import {diffInput, wrap} from '@sanity/diff'
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
import {getDocumentAtRevision} from './getDocumentAtRevision'
import {buildDocumentForDiffInput} from './getDocumentChanges'
import {getDocumentTransactions} from './getDocumentTransactions'

/** @internal */
export interface EditChanges {
  loading: boolean
  diff: ObjectDiff | null
  error: Error | null
}

type DocumentContent = Partial<SanityDocument> | null

const LOADING: EditChanges = {loading: true, diff: null, error: null}

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

function diffContents(before: DocumentContent, after: DocumentContent): ObjectDiff {
  return diffInput(
    wrap(buildDocumentForDiffInput(before), null),
    wrap(buildDocumentForDiffInput(after), null),
  ) as ObjectDiff
}

/**
 * Creates the `getEditChanges` function of an events store, which emits the changes made by the
 * edit transactions from `fromRevisionId` to `toRevisionId` (both included), e.g. the
 * transactions of an edit event, for a condensed view of what it changed.
 *
 * The document before the first transaction isn't addressable by a revision, so it is rebuilt from
 * the document at `toRevisionId` by reverting the transactions newest first. The diff between the
 * two carries no annotations: who made each change isn't part of the result.
 *
 * Every document content rebuilt on the way is kept, before and after each transaction of the
 * range, so the changes of any range within it (one listed transaction of a group whose changes
 * were already shown) are computed without fetching anything. Ranges being fetched are shared
 * between subscribers.
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
  const contentBefore = new Map<string, DocumentContent>()
  const contentAfter = new Map<string, DocumentContent>()
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
        // The effects apply to the document without its revision, as in `calculateDiff`. The
        // transactions of the range are all the ones of the document, so the content before one
        // is the content after the previous one.
        const {_rev, ...afterContent} = after.document
        let content: DocumentContent = afterContent
        for (const transaction of transactions.toReversed()) {
          contentAfter.set(transaction.id, content)
          const effect = transaction.effects[documentId]
          content = effect ? applyPatch(content, effect.revert) : content
          contentBefore.set(transaction.id, content)
        }
        return {
          loading: false,
          error: null,
          diff: diffContents(contentBefore.get(fromRevisionId) ?? null, afterContent),
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
    if (contentBefore.has(fromRevisionId) && contentAfter.has(toRevisionId)) {
      return of({
        loading: false,
        error: null,
        diff: diffContents(
          contentBefore.get(fromRevisionId) ?? null,
          contentAfter.get(toRevisionId) ?? null,
        ),
      })
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
