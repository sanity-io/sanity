import {applyPatch} from 'mendoza'
import {TaskDocument} from '../../../types'
import {TransactionLogEventWithEffects} from 'sanity'

export interface FieldChange {
  field: keyof TaskDocument
  from: any
  to: any
  timestamp: string
}

function omitRev(document: TaskDocument) {
  const {_rev, ...doc} = document
  return doc
}

/**
 * Tracks changes to specified fields across document versions by applying patches in reverse.
 * @param newestDocument The latest state of the document.
 * @param transactions An array of transactions containing patches.
 * @param fieldsToTrack The fields to track for changes.
 * @returns An array of changes for the tracked fields.
 */
export async function trackFieldChanges(
  newestDocument: TaskDocument,
  transactions: TransactionLogEventWithEffects[],
  fieldsToTrack: (keyof Omit<TaskDocument, '_rev'>)[],
): Promise<FieldChange[]> {
  // Sort transactions by timestamp in descending order
  // transactions.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  let currentDocument: Omit<TaskDocument, '_rev'> = omitRev(newestDocument)
  const changes: FieldChange[] = []
  let previousDocument = currentDocument

  for (const transaction of transactions) {
    const {timestamp, effects} = transaction

    // Assuming there's a single document being tracked in this transaction
    const documentId = transaction.documentIDs[0]
    const effect = effects[documentId]
    if (!effect || !effect.revert) continue

    previousDocument = applyPatch(currentDocument, effect.revert)

    // Track changes for specified fields
    fieldsToTrack.forEach((field) => {
      // TODO: fix no-loop-func eslint error
      if (previousDocument?.[field] !== currentDocument?.[field]) {
        changes.push({
          field,
          from: currentDocument?.[field],
          to: previousDocument?.[field],
          timestamp,
        })
      }
    })

    // Prepare for next iteration
    currentDocument = previousDocument
  }

  // Return changes sorted by timestamp in ascending order
  return changes.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}

// Test to verify changes are correctly identified
// describe('trackFieldChanges', () => {
//   it('correctly identifies changes to tracked fields 2', async () => {
//     // Example usage
//     const newestDocument: Document = JSON.parse(original2)
//     const transactions: Transaction[] = NdJson.parse(patches2)
//     const fieldsToTrack: (keyof Document)[] = ['assignedTo', 'status', 'subscribers']

//     const changes = await trackFieldChanges(newestDocument, [...transactions], fieldsToTrack)
//     console.log(changes)
//     const expectedChanges = []

//     expect(changes).toEqual(expectedChanges)
//   })
// })
