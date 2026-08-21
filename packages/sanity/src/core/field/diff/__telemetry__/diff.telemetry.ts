import {defineEvent} from '@sanity/telemetry'

interface DocumentChangesRevertedInfo {
  /** Breadth of the revert: the whole document, a field group, or a single field */
  scope: 'all' | 'group' | 'field'
  /**
   * Flat count of field changes the revert covered. Every scope measures at this depth, so the
   * three compare directly. Runs ahead of the rows on screen, which collapse siblings into groups.
   */
  changeCount: number
}

/**
 * @internal
 */
export const DocumentChangesReverted = defineEvent<DocumentChangesRevertedInfo>({
  name: 'Document Changes Reverted',
  version: 1,
  description: 'User reverted changes from the review changes pane',
})
