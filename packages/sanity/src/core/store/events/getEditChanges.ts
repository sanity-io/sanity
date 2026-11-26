import {type SanityClient} from '@sanity/client'
import {type SanityDocument, type TransactionLogEventWithEffects} from '@sanity/types'
import {applyPatch} from 'mendoza'
import {
  catchError,
  combineLatest,
  filter,
  map,
  type Observable,
  of,
  startWith,
  switchMap,
  take,
} from 'rxjs'

import {type ObjectDiff} from '../../field/types'
import {calculateDiff} from './calculateDiff'
import {getDocumentAtRevision} from './getDocumentAtRevision'
import {getEffectState} from './getEditEvents'

/** @internal */
export interface EditChanges {
  loading: boolean
  diff: ObjectDiff | null
  error: Error | null
}

/**
 * Transactions of the document that follow each other, oldest first, as the events store fetched
 * them. The live chain is the newest fetch followed by the transactions received since: the live
 * document is the result of its transactions.
 *
 * @internal
 */
export interface TransactionChain {
  transactions: TransactionLogEventWithEffects[]
  live: boolean
}

type DocumentContent = Partial<SanityDocument> | null

/** The content of the document after the transaction at `index` of a chain. */
interface Anchor {
  index: number
  content: DocumentContent
}

interface ChainRange {
  chain: TransactionChain
  fromIndex: number
  toIndex: number
}

const LOADING: EditChanges = {loading: true, diff: null, error: null}

/** The fields `buildDocumentForDiffInput` leaves out of a diff, which `calculateDiff` keeps. */
const SYSTEM_FIELDS = new Set(['_id', '_type', '_createdAt', '_updatedAt'])

/**
 * The chains of the transactions the events store has: the live chain first, then the fetches for
 * expanded events and the older fetches for edit events.
 *
 * The live chain is the newest fetch for edit events followed by the remote transactions newer than
 * it, when they are known to follow it: they continue from a revision the fetch has
 * (`remoteStartRev`), or the fetch has some of them already. Otherwise transactions may be missing
 * between them, so the remote transactions are the live chain on their own and the fetch is
 * another chain.
 *
 * @internal
 */
export function getTransactionChains({
  fetched,
  remote,
  remoteStartRev,
  expanded,
}: {
  fetched: TransactionLogEventWithEffects[][]
  remote: TransactionLogEventWithEffects[]
  remoteStartRev: string | undefined
  expanded: TransactionLogEventWithEffects[][]
}): TransactionChain[] {
  const newestFetch = fetched.at(-1) ?? []
  const fetchedIds = new Set(newestFetch.map(({id}) => id))
  const newestFetched = newestFetch.at(-1)
  // The listener replays its last mutation to a new subscriber, which can be older than the fetch.
  const fetchedUntil = newestFetched ? Date.parse(newestFetched.timestamp) : -Infinity
  const received = remote.filter(
    (transaction) =>
      !fetchedIds.has(transaction.id) && Date.parse(transaction.timestamp) >= fetchedUntil,
  )
  const followsFetch =
    received.length === 0 ||
    (remoteStartRev !== undefined && fetchedIds.has(remoteStartRev)) ||
    remote.some((transaction) => fetchedIds.has(transaction.id))
  const others = [...(followsFetch ? [] : [newestFetch]), ...expanded, ...fetched.slice(0, -1)]
  return [
    {transactions: followsFetch ? [...newestFetch, ...received] : received, live: true},
    ...others
      .filter((transactions) => transactions.length > 0)
      .map((transactions) => ({transactions, live: false})),
  ]
}

function findRange(
  chains: TransactionChain[],
  fromRevisionId: string,
  toRevisionId: string,
): ChainRange | undefined {
  for (const chain of chains) {
    const fromIndex = chain.transactions.findIndex(({id}) => id === fromRevisionId)
    const toIndex = chain.transactions.findIndex(({id}) => id === toRevisionId)
    if (fromIndex !== -1 && toIndex >= fromIndex) return {chain, fromIndex, toIndex}
  }
  return undefined
}

function withoutRev(document: SanityDocument): DocumentContent {
  const {_rev, ...content} = document
  return content
}

/** The live document, as the anchor of the live chain when one of its transactions resulted in it. */
function getLiveAnchor(
  chain: TransactionChain,
  liveDocument: SanityDocument | null | undefined,
): Anchor | undefined {
  if (!chain.live || !liveDocument) return undefined
  const index = chain.transactions.findIndex(({id}) => id === liveDocument._rev)
  return index === -1 ? undefined : {index, content: withoutRev(liveDocument)}
}

/**
 * The first transaction deleting the document from the end of a range on: there is no document
 * after it, and its revert has all of the document before it, so it anchors the range for free.
 */
function getDeletionAnchor({chain, toIndex}: ChainRange, documentId: string): Anchor | undefined {
  for (let index = toIndex; index < chain.transactions.length; index++) {
    if (getEffectState(chain.transactions[index].effects[documentId]) === 'deleted') {
      return {index, content: null}
    }
  }
  return undefined
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
 * Creates the `getEditChanges` function of an events store, which emits the changes made by the
 * edit transactions from `fromRevisionId` to `toRevisionId` (both included), e.g. the
 * transactions of an edit event, for a condensed view of what it changed.
 *
 * The transactions are the ones the events store fetched for its events (`chains$`), so none are
 * fetched again. The document before the first one is rebuilt from an anchor, the document after a
 * transaction of the same chain, by reverting the transactions down to it (or applying them, for an
 * anchor older than it). The transactions are then replayed on top of it, as in `calculateDiff`, so
 * every change is annotated with the author and timestamp of the transaction that made it.
 *
 * The anchor of the live chain is the live document (`liveDocument$`), whose revision is one of its
 * transactions, so the edits of the document as it is now and the ones arriving live need no
 * request: the changes wait for the live document rather than fetching it. A transaction deleting
 * the document after a range anchors it too, as there is no document after it. Other chains (an
 * expanded publish, an older fetch), and the live chain when the live document isn't the result of
 * one of its transactions, are anchored by the document at their newest transaction, fetched once
 * and shared by all their ranges.
 *
 * The content rebuilt before each transaction is kept, for the transactions the store still has,
 * so ranges sharing transactions (a group and the transactions listed under it) rebuild nothing
 * twice. The changes of a range don't change: once emitted, they complete.
 *
 * Emits `loading` first, and an `error` when the anchor document can't be fetched (e.g. history
 * retention) or the changes can't be rebuilt.
 */
export function createEditChanges({
  client,
  documentId,
  chains$,
  liveDocument$,
}: {
  client: SanityClient
  documentId: string
  chains$: Observable<TransactionChain[]>
  liveDocument$: Observable<SanityDocument | null | undefined>
}) {
  const contentBefore = new Map<string, DocumentContent>()

  const forgetUnknownTransactions = (chains: TransactionChain[]) => {
    const known = new Set(chains.flatMap((chain) => chain.transactions.map(({id}) => id)))
    for (const id of contentBefore.keys()) {
      if (!known.has(id)) contentBefore.delete(id)
    }
  }

  const applyEffect = (
    transaction: TransactionLogEventWithEffects,
    direction: 'apply' | 'revert',
    content: DocumentContent,
  ): DocumentContent => {
    const effect = transaction.effects[documentId]
    return effect ? applyPatch(content, effect[direction]) : content
  }

  const rebuildContentBefore = (
    transactions: TransactionLogEventWithEffects[],
    index: number,
    anchor: Anchor,
  ): DocumentContent => {
    if (index > anchor.index) {
      let content = anchor.content
      for (let next = anchor.index + 1; next < index; next++) {
        content = applyEffect(transactions[next], 'apply', content)
      }
      contentBefore.set(transactions[index].id, content)
      return content
    }
    // Starts from the closest content already rebuilt, the anchor otherwise.
    let content = anchor.content
    let next = anchor.index
    for (let rebuilt = index; rebuilt <= anchor.index; rebuilt++) {
      const id = transactions[rebuilt].id
      if (contentBefore.has(id)) {
        content = contentBefore.get(id) ?? null
        next = rebuilt - 1
        break
      }
    }
    for (; next >= index; next--) {
      content = applyEffect(transactions[next], 'revert', content)
      contentBefore.set(transactions[next].id, content)
    }
    return content
  }

  const fetchAnchor = (chain: TransactionChain): Observable<Anchor> => {
    const index = chain.transactions.length - 1
    const revisionId = chain.transactions[index].id
    return getDocumentAtRevision({client, documentId, revisionId}).pipe(
      filter((revision) => !revision?.loading),
      take(1),
      map((revision) => {
        if (!revision?.document) throw new Error(`Missing document for revision ${revisionId}`)
        return {index, content: withoutRev(revision.document)}
      }),
    )
  }

  const diffRange = ({chain, fromIndex, toIndex}: ChainRange, anchor: Anchor): EditChanges => ({
    loading: false,
    error: null,
    diff: omitSystemFields(
      calculateDiff({
        documentId,
        initialDoc: rebuildContentBefore(chain.transactions, fromIndex, anchor) ?? {},
        transactions: chain.transactions.slice(fromIndex, toIndex + 1),
        events: [],
      }),
    ),
  })

  return function getEditChanges({
    fromRevisionId,
    toRevisionId,
  }: {
    fromRevisionId: string
    toRevisionId: string
  }): Observable<EditChanges> {
    return combineLatest([chains$, liveDocument$]).pipe(
      map(([chains, liveDocument]) => {
        const range = findRange(chains, fromRevisionId, toRevisionId)
        if (!range || (range.chain.live && liveDocument === undefined)) return undefined
        forgetUnknownTransactions(chains)
        return {
          range,
          anchor: getLiveAnchor(range.chain, liveDocument) ?? getDeletionAnchor(range, documentId),
        }
      }),
      filter((resolved) => resolved !== undefined),
      take(1),
      switchMap(({range, anchor}) =>
        (anchor ? of(anchor) : fetchAnchor(range.chain)).pipe(
          map((resolvedAnchor) => diffRange(range, resolvedAnchor)),
        ),
      ),
      startWith(LOADING),
      catchError((error: Error) => of({loading: false, diff: null, error})),
    )
  }
}
