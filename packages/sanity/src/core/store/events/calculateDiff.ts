import {type SanityDocument, type TransactionLogEventWithEffects} from '@sanity/types'
import {applyPatch, incremental} from 'mendoza'

import {type ObjectDiff} from '../../field/types'
import {diffValue, type EventMeta} from './diffValue'
import {type DocumentGroupEvent, isEditDocumentVersionEvent} from './types'

function omitRev(document: SanityDocument): Omit<SanityDocument, '_rev'> {
  const {_rev, ...doc} = document
  return doc
}

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
