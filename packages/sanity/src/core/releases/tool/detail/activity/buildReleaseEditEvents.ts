import {type TransactionLogEventWithEffects} from '@sanity/types'

import {applyMendozaPatch} from '../../../../preview/utils/applyMendozaPatch'
import {type ReleaseDocument, type ReleaseType} from '../../../store/types'
import {getReleaseIdFromReleaseDocumentId} from '../../../util/getReleaseIdFromReleaseDocumentId'
import {type CreateReleaseEvent, type EditReleaseEvent} from './types'

export function buildReleaseEditEvents(
  transactions: TransactionLogEventWithEffects[],
  release: ReleaseDocument,
): (EditReleaseEvent | CreateReleaseEvent)[] {
  // Confirm we have all the events by checking the first transaction id and the release._rev, the should match.
  if (release._rev !== transactions[0]?.id) {
    console.error('Some transactions are missing, cannot calculate the edit events')
    return []
  }

  const releaseEditEvents: (EditReleaseEvent | CreateReleaseEvent)[] = []
  // We start from the last release document and apply changes in reverse order
  // Compare for each transaction what changed, if metadata.releaseType or metadata.intendedPublishAt changed build an event.
  let currentDocument = release
  for (const transaction of transactions) {
    const effect = transaction.effects[release._id]
    if (!effect) continue
    // This will apply the revert effect to the document, so we will get the document from before this change.
    const before = applyMendozaPatch(currentDocument, effect.revert)
    const changed: {
      releaseType?: ReleaseType
      intendedPublishDate?: string
    } = {}

    if (before?.metadata.releaseType !== currentDocument.metadata.releaseType) {
      changed.releaseType = currentDocument.metadata.releaseType
    }
    if (before?.metadata.intendedPublishAt !== currentDocument.metadata.intendedPublishAt) {
      changed.intendedPublishDate = currentDocument.metadata.intendedPublishAt
    }
    // If the "changed" object has more than one key identify it as a change event
    if (Object.values(changed).length >= 1) {
      releaseEditEvents.push({
        type: before ? 'releaseEditEvent' : 'createRelease',
        author: transaction.author,
        change: changed,
        id: transaction.id,
        timestamp: transaction.timestamp,
        releaseName: getReleaseIdFromReleaseDocumentId(release._id),
      })
      currentDocument = before
    }
  }
  return releaseEditEvents
}
