import {type TaskDocument} from '../../../types'
import {type FieldChange} from './parseTransactions'

const FIELDS_TO_GROUP: (keyof TaskDocument)[] = [
  'title',
  'status',
  'assignedTo',
  'dueBy',
  'target',
  'description',
]
const GROUP_TIME = 2 * 60 * 1000 // 2 minutes
export function groupChanges(changes: FieldChange[]): FieldChange[] {
  // If we have two or more changes done by the same user in a similar timestamp +- X time, in any of the fields specified  we group them together.
  const groupedChanges: FieldChange[] = []
  for (const change of changes) {
    const lastChangeProcessed = groupedChanges[groupedChanges.length - 1]
    if (!lastChangeProcessed) {
      groupedChanges.push(change)
      continue
    }
    if (!FIELDS_TO_GROUP.includes(change.field)) {
      groupedChanges.push(change)
      continue
    }
    if (
      lastChangeProcessed.author === change.author &&
      lastChangeProcessed.field === change.field
    ) {
      // Check the timestamp difference
      const lastChangeDate = new Date(lastChangeProcessed.timestamp)
      const changeDate = new Date(change.timestamp)
      const diff = Math.abs(lastChangeDate.getTime() - changeDate.getTime())
      if (diff <= GROUP_TIME) {
        // We keep the from value and update the to value, and the date.
        lastChangeProcessed.to = change.to
        lastChangeProcessed.timestamp = change.timestamp
        continue
      }
    }
    groupedChanges.push(change)
  }

  return groupedChanges
}
