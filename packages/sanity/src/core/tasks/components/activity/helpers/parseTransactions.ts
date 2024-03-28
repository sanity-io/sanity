import {type TransactionLogEventWithEffects} from '@sanity/types'
import {applyPatch} from 'mendoza'

import {type TaskDocument} from '../../../types'
import {groupChanges} from './groupChanges'

export interface FieldChange {
  field: keyof TaskDocument
  from: any
  to: any
  timestamp: string
  author: string
}

function omitRev(document: TaskDocument) {
  const {_rev, ...doc} = document
  return doc
}

/**
 * Tracks changes to specified fields across document versions by applying patches in reverse.
 * @param newestDocument -  The latest state of the document.
 * @param transactions - An array of transactions containing patches.
 * @param fieldsToTrack - The fields to track for changes.
 * @returns An array of changes for the tracked fields.
 */
export function trackFieldChanges(
  newestDocument: TaskDocument,
  transactions: TransactionLogEventWithEffects[],
  fieldsToTrack: (keyof Omit<TaskDocument, '_rev'>)[],
): FieldChange[] {
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
    // eslint-disable-next-line no-loop-func
    fieldsToTrack.forEach((field) => {
      if (previousDocument?.[field] !== currentDocument?.[field]) {
        changes.push({
          field,
          from: previousDocument?.[field],
          to: currentDocument?.[field],
          timestamp,
          author: transaction.author,
        })
      }
    })

    // Prepare for next iteration
    currentDocument = previousDocument
  }

  const changesSortedByTimestamp = changes.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  // Find the moment the task was created by the user.
  const createdByUserIndex = changesSortedByTimestamp.findIndex(
    (change) => change.field === 'createdByUser',
  )

  // Return changes sorted by timestamp in ascending order from the moment the task was created.
  return groupChanges(changesSortedByTimestamp.slice(createdByUserIndex + 1))
}
