import {defineEvent} from '@sanity/telemetry'

interface DocumentChangesRevertedInfo {
  /** Breadth of the revert: the whole document, a field group, or a single field */
  scope: 'all' | 'group' | 'field'
  /** Number of field changes the revert covered; always 1 for the `field` scope */
  changeCount: number
}

/** When changes are reverted from the review changes pane */
export const DocumentChangesReverted = defineEvent<DocumentChangesRevertedInfo>({
  name: 'Document Changes Reverted',
  version: 1,
  description: 'User reverted changes from the review changes pane',
})
