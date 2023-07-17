/**
 * Defined locale strings for the desk tool, in US English.
 *
 * @internal
 */
const deskLocaleStrings = {
  /** Label for the "Publish" document action when there are pending changes.*/
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

  /** Tooltip when publish button is disabled because the studio is not ready.*/
  'action.publish.disabled.notReady': 'Operation not ready',

  /** Tooltip when publish button is waiting for validation and async tasks to complete.*/
  'action.publish.waiting': 'Waiting for tasks to finish before publishing',
}

/**
 * @alpha
 */
export type DeskLocaleResourceKeys = keyof typeof deskLocaleStrings

export default deskLocaleStrings
