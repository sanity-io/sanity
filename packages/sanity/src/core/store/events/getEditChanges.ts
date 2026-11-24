import {type SanityClient} from '@sanity/client'
import {diffInput, wrap} from '@sanity/diff'
import {type SanityDocument, type TransactionLogEventWithEffects} from '@sanity/types'
import {applyPatch} from 'mendoza'
import {catchError, combineLatest, from, map, type Observable, of, startWith} from 'rxjs'

import {type ObjectDiff} from '../../field/types'
import {getDocumentAtRevision} from './getDocumentAtRevision'
import {buildDocumentForDiffInput} from './getDocumentChanges'
import {getDocumentTransactions} from './getDocumentTransactions'

interface EditChanges {
  loading: boolean
  diff: ObjectDiff | null
  error: Error | null
}

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

/**
 * Emits the changes made by the edit transactions from `fromRevisionId` to `toRevisionId` (both
 * included), e.g. the transactions of an edit event, for a condensed view of what it changed.
 *
 * The document before the first transaction isn't addressable by a revision, so it is rebuilt from
 * the document at `toRevisionId` by reverting the transactions newest first. The diff between the
 * two carries no annotations: who made each change isn't part of the result.
 *
 * Emits `loading` first, and an `error` when the document at `toRevisionId` can't be fetched (e.g.
 * history retention) or the transactions can't be fetched.
 */
export function getEditChanges({
  client,
  documentId,
  fromRevisionId,
  toRevisionId,
}: {
  client: SanityClient
  documentId: string
  fromRevisionId: string
  toRevisionId: string
}): Observable<EditChanges> {
  const after$ = getDocumentAtRevision({client, documentId, revisionId: toRevisionId})
  const transactions$ = from(
    getTransactionsIncludingFirst({client, documentId, fromRevisionId, toRevisionId}),
  )

  return combineLatest([after$, transactions$]).pipe(
    map(([after, transactions]): EditChanges => {
      if (!after || after.loading) return LOADING
      if (!after.document) {
        return {
          loading: false,
          diff: null,
          error: new Error(`Missing document for revision ${toRevisionId}`),
        }
      }
      // The effects apply to the document without its revision, as in `calculateDiff`.
      const {_rev, ...afterContent} = after.document
      const before = transactions
        .toReversed()
        .reduce<Partial<SanityDocument> | null>((document, transaction) => {
          const effect = transaction.effects[documentId]
          return effect ? applyPatch(document, effect.revert) : document
        }, afterContent)
      return {
        loading: false,
        error: null,
        diff: diffInput(
          wrap(buildDocumentForDiffInput(before), null),
          wrap(buildDocumentForDiffInput(after.document), null),
        ) as ObjectDiff,
      }
    }),
    startWith(LOADING),
    catchError((error: Error) => of({loading: false, diff: null, error})),
  )
}
