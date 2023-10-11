/**
 * Defined locale strings for the desk tool, in US English.
 *
 * @internal
 */
const deskLocaleStrings = {
  /** --- PUBLISH ACTION --- */
  /** Tooltip when action is disabled because the studio is not ready.*/
  'action.publish.disabled.notReady': 'Operation not ready',

  /** Label for action when there are pending changes.*/
  'action.publish.draft.label': 'Publish',

  /** Label for the "Publish" document action while publish is being executed.*/
  'action.publish.running.label': 'Publishing…',

  /** Label for the "Publish" document action when there are no changes.*/
  'action.publish.published.label': 'Published',

  /** Label for the "Publish" document action when the document has live edit enabled.*/
  'action.publish.liveEdit.label': 'Publish',

  /** Tooltip for the "Publish" document action when the document has live edit enabled.*/
  'action.publish.liveEdit.tooltip':
    'Live Edit is enabled for this content type and publishing happens automatically as you make changes',

  /** Fallback tooltip for the "Publish" document action when publish is invoked for a document with live edit enabled.*/
  'action.publish.liveEdit.publishDisabled':
    'Cannot publish since liveEdit is enabled for this document type',

  /** Tooltip when the "Publish" document action is disabled due to validation issues */
  'action.publish.validationIssues.tooltip':
    'There are validation errors that need to be fixed before this document can be published',

  /** Tooltip when publish button is disabled because the document is already published.*/
  'action.publish.alreadyPublished.tooltip': 'Published {{timeSincePublished}} ago',

  /** Tooltip when publish button is disabled because the document is already published, and published time is unavailable.*/
  'action.publish.alreadyPublished.noTimeAgo.tooltip': 'Already published',

  /** Tooltip when publish button is disabled because there are no changes.*/
  'action.publish.tooltip.noChanges': 'No unpublished changes',

  /** Tooltip when publish button is waiting for validation and async tasks to complete.*/
  'action.publish.waiting': 'Waiting for tasks to finish before publishing',

  /** --- DELETE ACTION --- **/
  /** Tooltip when action button is disabled because the operation is not ready   */
  'action.delete.disabled.notReady': 'Operation not ready',

  /** Tooltip when action button is disabled because the document does not exist */
  'action.delete.disabled.nothingToDelete': 'This document doesn’t yet exist or is already deleted',

  /** Label for the "Delete" document action button */
  'action.delete.label': 'Delete',

  /** Label for the "Delete" document action while the document is being deleted */
  'action.delete.running.label': 'Deleting…',

  /** --- DISCARD CHANGES ACTION --- **/
  /** Tooltip when action button is disabled because the operation is not ready   */
  'action.discardChanges.disabled.notReady': 'Operation not ready',

  /** Label for the "Discard changes" document action */
  'action.discardChanges.label': 'Discard changes',

  /** Tooltip when action is disabled because the document has no unpublished changes */
  'action.discardChanges.disabled.noChange': 'This document has no unpublished changes',

  /** Tooltip when action is disabled because the document is not published */
  'action.discardChanges.disabled.notPublished': 'This document is not published',

  /** Message prompting the user to confirm discarding changes */
  'action.discardChanges.confirmDialog.confirmDiscardChanges':
    'Are you sure you want to discard all changes since last published?',

  /** --- DUPLICATE ACTION --- */
  /** Tooltip when action is disabled because the operation is not ready   */
  'action.duplicate.disabled.notReady': 'Operation not ready',

  /** Tooltip when action is disabled because the document doesn't exist */
  'action.duplicate.disabled.nothingToDuplicate':
    "This document doesn't yet exist so there‘s nothing to duplicate",

  /** Label for the "Duplicate" document action */
  'action.duplicate.label': 'Duplicate',

  /** Label for the "Duplicate" document action while the document is being duplicated */
  'action.duplicate.running.label': 'Duplicating…',
}

/**
 * @alpha
 */
export type DeskLocaleResourceKeys = keyof typeof deskLocaleStrings

export default deskLocaleStrings
