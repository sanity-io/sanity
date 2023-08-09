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

  /** --- Review Changes --- */

  /** Title for the Review Changes pane */
  'desk.review-changes.title': 'Review changes',

  /** Label for the close button label in Review Changes pane */
  'desk.review-changes.close-label': 'Close review changes',

  /** Label and text for differences tooltip that indicates the authors of the changes */
  'desk.review-changes.changes-by-author': 'Changes by',

  /** Loading changes in Review Changes Pane */
  'desk.review-changes.loading-changes': 'Loading changes',

  /** --- Timeline --- */

  /** Error prompt when revision cannot be loaded */
  'desk.timeline.unable-to-load-rev': 'Unable to load revision',

  /** Label for latest version for timeline menu dropdown */
  'desk.timeline.latest-version': 'Latest version',

  /** Label for loading history */
  'desk.timeline.loading-history': 'Loading history',

  /** Label for determining since which version the changes for timeline menu dropdown are showing.
   * Receives the time label as a parameter.
   */
  'desk.timeline.since': 'Since: {{timeLabel}}',

  /** Label for missing change version for timeline menu dropdown are showing */
  'desk.timeline.since-version-missing': 'Since: unknown version',

  /** Title for error when the timeline for the given document can't be loaded */
  'desk.timeline.error-title': 'An error occurred whilst retrieving document changes.',

  /** Description for error when the timeline for the given document can't be loaded */
  'desk.timeline.error-description': 'Document history transactions have not been affected.',

  /** Error title for when the document doesn't have history */
  'desk.timeline.no-document-history-title': 'No document history',

  /** Error description for when the document doesn't have history */
  'desk.timeline.no-document-history-description':
    'When changing the content of the document, the document versions will appear in this menu.',

  /** --- Timeline constants --- */

  /** Label for when the timeline item is the latest in the history */
  'desk.timeline.latest': 'Latest',

  /** Consts used in the timeline item component (dropdown menu) - helpers */
  'desk.timeline.create': 'created',
  'desk.timeline.delete': 'deleted',
  'desk.timeline.discardDraft': 'discarded draft',
  'desk.timeline.initial': 'created',
  'desk.timeline.editDraft': 'edited',
  'desk.timeline.editLive': 'live edited',
  'desk.timeline.publish': 'published',
  'desk.timeline.unpublish': 'unpublished',
}

/**
 * @alpha
 */
export type DeskLocaleResourceKeys = keyof typeof deskLocaleStrings

export default deskLocaleStrings
