import {type SanityDocument, type TransactionLogEventWithEffects} from '@sanity/types'
import {applyPatch, incremental} from 'mendoza'

import {type ObjectDiff} from '../../field/types'
import {diffValue, type EventMeta} from './diffValue'
import {type DocumentGroupEvent, isEditDocumentVersionEvent} from './types'

function omitRev(document: SanityDocument): Omit<SanityDocument, '_rev'> {
  const {_rev, ...doc} = document
  return doc
}

/**
 * Computes the annotated diff between `initialDoc` and the document that results from replaying
 * `transactions` (mendoza apply patches) on top of it.
 *
 * Each replayed transaction records `{transactionIndex, event}` metadata — `event` being the
 * non-edit `DocumentGroupEvent` whose `revisionId` matches the transaction id, when one exists —
 * so every changed value in the resulting `ObjectDiff` carries an `Annotation` with the
 * author/timestamp of the transaction that changed it (and the related event, e.g. a publish).
 *
 * Annotation semantics:
 * - "from" side: the annotation points at the transaction *after* the one recorded in the value's
 *   end metadata (where the old value disappeared); when a value existed before the range, the
 *   first transaction in the range is used as fallback.
 * - "to" side: the annotation points at the transaction recorded in the value's start metadata
 *   (where the new value appeared); values untouched within the range get no annotation.
 *
 * Transactions with no effect for `documentId` are skipped. `_rev` is stripped before diffing so
 * revision churn alone never shows up as a change.
 */
export function calculateDiff({
  initialDoc,
  documentId,
  transactions,
  events = [],
}: {
  initialDoc: SanityDocument
  finalDoc?: SanityDocument
  transactions: TransactionLogEventWithEffects[]
  events: DocumentGroupEvent[]
  documentId: string
}) {
  const initialValue = incremental.wrap<EventMeta>(omitRev(initialDoc), null)
  let document = incremental.wrap<EventMeta>(omitRev(initialDoc), null)
  let finalDocument = omitRev(initialDoc)
  transactions.forEach((transaction, index) => {
    const meta: EventMeta = {
      transactionIndex: index,
      event: events.find(
        (event) =>
          !isEditDocumentVersionEvent(event) &&
          'revisionId' in event &&
          event.revisionId === transaction.id,
      ),
    }
    const effect = transaction.effects[documentId]
    if (effect) {
      document = incremental.applyPatch(document, effect.apply, meta)
      finalDocument = applyPatch(finalDocument, effect.apply)
    }
  })

  const diff = diffValue({
    transactions,
    fromValue: initialValue,
    fromRaw: initialDoc,
    toValue: document,
    toRaw: finalDocument,
  }) as ObjectDiff
  return diff
}
