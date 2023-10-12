/**
 * Defined locale strings for the desk tool, in US English.
 *
 * @internal
 */
const deskLocaleStrings = {
  /** --- PUBLISH ACTION --- */
  /** Tooltip when action is disabled because the studio is not ready.*/
  'action.publish.disabled.not-ready': 'Operation not ready',

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
  'action.publish.already-published.no-time-ago.tooltip': 'Already published',

  /** Tooltip when publish button is disabled because there are no changes.*/
  'action.publish.tooltip.noChanges': 'No unpublished changes',

  /** Tooltip when publish button is waiting for validation and async tasks to complete.*/
  'action.publish.waiting': 'Waiting for tasks to finish before publishing',

  /** --- DELETE ACTION --- **/
  /** Tooltip when action button is disabled because the operation is not ready   */
  'action.delete.disabled.not-ready': 'Operation not ready',

  /** Tooltip when action button is disabled because the document does not exist */
  'action.delete.disabled.nothing-to-delete':
    'This document doesn’t yet exist or is already deleted',

  /** Label for the "Delete" document action button */
  'action.delete.label': 'Delete',

  /** Label for the "Delete" document action while the document is being deleted */
  'action.delete.running.label': 'Deleting…',

  /** --- DISCARD CHANGES ACTION --- **/
  /** Tooltip when action button is disabled because the operation is not ready   */
  'action.discard-changes.disabled.not-ready': 'Operation not ready',

  /** Label for the "Discard changes" document action */
  'action.discard-changes.label': 'Discard changes',

  /** Tooltip when action is disabled because the document has no unpublished changes */
  'action.discard-changes.disabled.no-change': 'This document has no unpublished changes',

  /** Tooltip when action is disabled because the document is not published */
  'action.discard-changes.disabled.not-published': 'This document is not published',

  /** Message prompting the user to confirm discarding changes */
  'action.discard-changes.confirm-dialog.confirm-discard-changes':
    'Are you sure you want to discard all changes since last published?',

  /** --- DUPLICATE ACTION --- */
  /** Tooltip when action is disabled because the operation is not ready   */
  'action.duplicate.disabled.not-ready': 'Operation not ready',

  /** Tooltip when action is disabled because the document doesn't exist */
  'action.duplicate.disabled.nothing-to-duplicate':
    "This document doesn't yet exist so there‘s nothing to duplicate",

  /** Label for the "Duplicate" document action */
  'action.duplicate.label': 'Duplicate',

  /** Label for the "Duplicate" document action while the document is being duplicated */
  'action.duplicate.running.label': 'Duplicating…',

  /** --- UNPUBLISH ACTION --- */
  /** Tooltip when action is disabled because the operation is not ready   */
  'action.unpublish.disabled.not-ready': 'Operation not ready',

  /** Label for the "Unpublish" document action */
  'action.unpublish.label': 'Unpublish',

  /** Tooltip when action is disabled because the document is not already published */
  'action.unpublish.disabled.not-published': 'This document is not published',

  /** Fallback tooltip for the Unpublish document action when publish is invoked for a document with live edit enabled.*/
  'action.unpublish.live-edit.disabled':
    'This document has live edit enabled and cannot be unpublished',

  /** --- RESTORE ACTION --- */
  /** Label for the "Restore" document action */
  'action.restore.label': 'Restore',

  /** Fallback tooltip for when user is looking at the initial version */
  'action.restore.disabled.cannot-restore-initial': "You can't restore to the initial version",

  /** Default tooltip for the action */
  'action.restore.tooltip': 'Restore to this version',

  /** Message prompting the user to confirm that they want to restore to an earlier version*/
  'action.restore.confirm-dialog.confirm-discard-changes':
    'Are you sure you want to restore this document?',
}

/**
 * @alpha
 */
export type DeskLocaleResourceKeys = keyof typeof deskLocaleStrings

export default deskLocaleStrings
