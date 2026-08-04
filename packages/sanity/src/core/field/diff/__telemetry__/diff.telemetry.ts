import {defineEvent} from '@sanity/telemetry'

/**
 * @internal
 */
export interface DocumentChangesRevertedInfo {
  scope: 'all' | 'group' | 'field'
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
