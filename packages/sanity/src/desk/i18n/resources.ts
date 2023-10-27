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
  'action.publish.live-edit.label': 'Publish',

  /** Tooltip for the "Publish" document action when the document has live edit enabled.*/
  'action.publish.live-edit.tooltip':
    'Live Edit is enabled for this content type and publishing happens automatically as you make changes',

  /** Fallback tooltip for the "Publish" document action when publish is invoked for a document with live edit enabled.*/
  'action.publish.live-edit.publish-disabled':
    'Cannot publish since Live Edit is enabled for this document type',

  /** Tooltip when the "Publish" document action is disabled due to validation issues */
  'action.publish.validation-issues.tooltip':
    'There are validation errors that need to be fixed before this document can be published',

  /** Tooltip when publish button is disabled because the document is already published.*/
  'action.publish.already-published.tooltip': 'Published {{timeSincePublished}} ago',

  /** Tooltip when publish button is disabled because the document is already published, and published time is unavailable.*/
  'action.publish.already-published.no-time-ago.tooltip': 'Already published',

  /** Tooltip when publish button is disabled because there are no changes.*/
  'action.publish.no-changes.tooltip': 'No unpublished changes',

  /** Tooltip when publish button is waiting for validation and async tasks to complete.*/
  'action.publish.waiting': 'Waiting for tasks to finish before publishing',

  /** --- DELETE ACTION --- **/
  /** Tooltip when action button is disabled because the operation is not ready   */
  'action.delete.disabled.not-ready': 'Operation not ready',

  /** Tooltip when action button is disabled because the document does not exist */
  'action.delete.disabled.nothing-to-delete':
    "This document doesn't yet exist or is already deleted",

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
    "This document doesn't yet exist so there's nothing to duplicate",

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

  /** --- PUBLISH STATUS BUTTON --- */
  /** Accessibility label indicating when the document was last updated, in relative time, eg "2 hours ago" */
  'status-bar.publish-status-button.last-updated-time.aria-label': 'Last updated {{relativeTime}}',

  /** Accessibility label indicating when the document was last published, in relative time, eg "3 weeks ago" */
  'status-bar.publish-status-button.last-published-time.aria-label':
    'Last published {{relativeTime}}',

  /** Text for tooltip showing explanation of timestamp/relative time, eg "Last updated <RelativeTime/>" */
  'status-bar.publish-status-button.last-updated-time.tooltip': 'Last updated <RelativeTime/>',

  /** Text for tooltip showing explanation of timestamp/relative time, eg "Last published <RelativeTime/>" */
  'status-bar.publish-status-button.last-published-time.tooltip': 'Last published <RelativeTime/>',

  /** --- REVIEW CHANGES BUTTON --- */
  /** Label for button when status is syncing */
  'status-bar.review-changes-button.status.syncing.text': 'Saving...',

  /** Label for button when status is saved */
  'status-bar.review-changes-button.status.saved.text': 'Saved!',

  /** Primary text for tooltip for the button */
  'status-bar.review-changes-button.tooltip.text': 'Review changes',

  /** Text for the secondary text for tooltip for the button */
  'status-bar.review-changes-button.tooltip.changes-saved': 'Changes saved',

  /** Aria label for the button */
  'status-bar.review-changes-button.aria-label': 'Review changes',

  /** --- DOCUMENT JSON INSPECTOR --- */
  /** Title shown for menu item that opens the "Inspect" dialog */
  'document-inspector.menu-item.title': 'Inspect',

  /** The title shown in the dialog header, when inspecting a valid document */
  'document-inspector.dialog.title': 'Inspecting <DocumentTitle/>',

  /** The title shown in the dialog header, when the document being inspected is not created yet/has no value */
  'document-inspector.dialog.title-no-value': 'No value',

  /** The "parsed" view mode, meaning the JSON is searchable, collapsible etc */
  'document-inspector.view-mode.parsed': 'Parsed',

  /** The "raw" view mode, meaning the JSON is presented syntax-highlighted, but with no other features - optimal for copying */
  'document-inspector.view-mode.raw-json': 'Raw JSON',

  /** --- "PRODUCTION PREVIEW", eg link to content --- */
  'production-preview.menu-item.title': 'Open preview',

  /** -- DESK PANES -- */
  /** The tool tipe for the split pane button on the document panel header */
  'document-panel-header.split-pane-button.tooltip': 'Split pane right',

  /** The text content for the deleted document banner */
  'banners.deleted-document-banner.text': 'This document has been deleted.',

  /** The text for the restore button on the deleted document banner */
  'banners.deleted-document-banner.restore-button.text': 'Restore most recent version',

  /** The text for the reference change banner if the reason is that the reference has been changed */
  'banners.reference-changed-banner.reason-changed.text':
    'This reference has changed since you opened it.',

  /** The text for the reload button */
  'banners.reference-changed-banner.reason-changed.reload-button.text': 'Reload reference',

  /** The text for the reference change banner if the reason is that the reference has been deleted */
  'banners.reference-changed-banner.reason-removed.text':
    'This reference has been removed since you opened it.',

  /** The text for the close button */
  'banners.reference-changed-banner.reason-removed.close-button.text': 'Close reference',

  /** The text for the permission check banner if there is only one role */
  'banners.permission-check-banner.singular-role.text':
    'Your role {{roles}} does not have permissions to {{requiredPermission}} this document.',

  /** The text for the permission check banner if there is are multiple roles */
  'banners.permission-check-banner.plural-roles.text':
    'Your roles {{roles}} do not have permissions to {{requiredPermission}} this document.',

  /** The text for when a form is hidden */
  'document-view.form-view.form-hidden': 'This form is hidden',

  /** The text for when the form view is loading a document */
  'document-view.form-view.loading': 'Loading document',

  /** The title of the sync lock toast on the form view */
  'document-view.form-view.sync-lock-toast.title': 'Syncing document…',

  /** The description of the sync lock toast on the form view */
  'document-view.form-view.sync-lock-toast.description':
    'Please hold tight while the document is synced. This usually happens right after the document has been published, and it should not take more than a few seconds',

  /** The title of the reconnecting toast */
  'panes.document-pane-provider.reconnecting-toast.title': 'Connection lost. Reconnecting…',

  /** The loading message for the document not found pane */
  'panes.document-pane.document-not-found.loading': 'Loading document…',

  /** The title of the document not found pane if the schema is known */
  'panes.document-pane.document-not-found.title': 'The document was not found',

  /** The text of the document not found pane if the schema is known */
  'panes.document-pane.document-not-found.text':
    'The document type is not defined, and a document with the <Code>{{id}}</Code> identifier could not be found.',

  /** The title of the document not found pane if the schema is not found or unknown */
  'panes.document-pane.document-unknown-type.title':
    'Unknown document type: <Code>{{documentType}}</Code>',

  /** The text of the document not found pane if the schema is not found */
  'panes.document-pane.document-unknown-type.text':
    'This document has the schema type <Code>{{documentType}}</Code>, which is not defined as a type in the local content studio schema.',

  /** The title of the document not found pane if the schema is unknown */
  'panes.document-pane.document-unknown-type.without-schema.text':
    'This document does not exist, and no schema type was specified for it.',

  /** The text of the document list pane if more than a maximum number of documents are returned */
  'panes.document-list-pane.max-items.text': 'Displaying a maximum of {{limit}} documents',

  /** The text of the document list pane if no documents are found */
  'panes.document-list-pane.no-documents.text': 'No results found',

  /** The text of the document list pane if no documents are found matching specified criteria */
  'panes.document-list-pane.no-matching-documents.text': 'No matching documents',

  /** The text of the document list pane if no documents are found for a specified type */
  'panes.document-list-pane.no-documents-of-type.text': 'No documents of this type',

  /** The error title on the document list pane */
  'panes.document-list-pane.error.title': 'Could not fetch list items',

  /** The error text on the document list pane */
  'panes.document-list-pane.error.text': 'Error: <Code>{{error}}</Code>',

  /** The summary title when displaying an error for a document operation result */
  'panes.document-operation-results.error.summary.title': 'Details',

  /** The text when a delete operation failed  */
  'panes.document-operation-results.delete-operation.error':
    'An error occurred while attempting to delete this document. This usually means that there are other documents that refers to it.',

  /** The text when an unpublish operation failed  */
  'panes.document-operation-results.unpublish-operation.error':
    'An error occurred while attempting to unpublish this document. This usually means that there are other documents that refers to it.',

  /** The text when a generic operation failed  */
  'panes.document-operation-results.generic-operation.error': 'An error occurred during {{op}}',

  /** The text when a publish operation succeded  */
  'panes.document-operation-results.publish-operation.success': 'The document was published',

  /** The text when an unpublish operation succeded  */
  'panes.document-operation-results.unpublish-operation.success':
    'The document was unpublished. A draft has been created from the latest published version.',

  /** The text when a discard changes operation succeded  */
  'panes.document-operation-results.discard-changes-operation.success':
    'All changes since last publish has now been discarded. The discarded draft can still be recovered from history',

  /** The text when a delete operation succeded  */
  'panes.document-operation-results.delete-operation.success':
    'The document was successfully deleted',

  /** The text when a generic operation succeded  */
  'panes.document-operation-results.generic-operation.success':
    'Successfully performed {{op}} on document',

  /** The text used in the document header title if creating a new item */
  'header.document-header-title.new.text': 'New {{item}}',

  /** The text used in the document header title if there is an error */
  'header.document-header-title.error.text': 'Error: {{error}}',

  /** The text used in the document header title if no other title can be determined */
  'header.document-header-title.untitled.text': 'Untitled',
}

/**
 * @alpha
 */
export type DeskLocaleResourceKeys = keyof typeof deskLocaleStrings

export default deskLocaleStrings
