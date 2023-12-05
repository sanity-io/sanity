/* eslint sort-keys: "error" */
import {defineLocalesResources} from 'sanity'

/**
 * Defined locale strings for the desk tool, in US English.
 *
 * @internal
 */
const structureLocaleStrings = defineLocalesResources('structure', {
  /** Tooltip when action button is disabled because the operation is not ready   */
  'action.delete.disabled.not-ready': 'Operation not ready',
  /** Tooltip when action button is disabled because the document does not exist */
  'action.delete.disabled.nothing-to-delete':
    "This document doesn't yet exist or is already deleted",
  /** Label for the "Delete" document action button */
  'action.delete.label': 'Delete',
  /** Label for the "Delete" document action while the document is being deleted */
  'action.delete.running.label': 'Deleting…',

  /** Message prompting the user to confirm discarding changes */
  'action.discard-changes.confirm-dialog.confirm-discard-changes':
    'Are you sure you want to discard all changes since last published?',
  /** Tooltip when action is disabled because the document has no unpublished changes */
  'action.discard-changes.disabled.no-change': 'This document has no unpublished changes',
  /** Tooltip when action is disabled because the document is not published */
  'action.discard-changes.disabled.not-published': 'This document is not published',
  /** Tooltip when action button is disabled because the operation is not ready   */
  'action.discard-changes.disabled.not-ready': 'Operation not ready',
  /** Label for the "Discard changes" document action */
  'action.discard-changes.label': 'Discard changes',

  /** Tooltip when action is disabled because the operation is not ready   */
  'action.duplicate.disabled.not-ready': 'Operation not ready',
  /** Tooltip when action is disabled because the document doesn't exist */
  'action.duplicate.disabled.nothing-to-duplicate':
    "This document doesn't yet exist so there's nothing to duplicate",
  /** Label for the "Duplicate" document action */
  'action.duplicate.label': 'Duplicate',
  /** Label for the "Duplicate" document action while the document is being duplicated */
  'action.duplicate.running.label': 'Duplicating…',
  /** Tooltip when publish button is disabled because the document is already published, and published time is unavailable.*/
  'action.publish.already-published.no-time-ago.tooltip': 'Already published',
  /** Tooltip when publish button is disabled because the document is already published.*/
  'action.publish.already-published.tooltip': 'Published {{timeSincePublished}} ago',

  /** Tooltip when action is disabled because the studio is not ready.*/
  'action.publish.disabled.not-ready': 'Operation not ready',
  /** Label for action when there are pending changes.*/
  'action.publish.draft.label': 'Publish',
  /** Label for the "Publish" document action when the document has live edit enabled.*/
  'action.publish.live-edit.label': 'Publish',
  /** Fallback tooltip for the "Publish" document action when publish is invoked for a document with live edit enabled.*/
  'action.publish.live-edit.publish-disabled':
    'Cannot publish since Live Edit is enabled for this document type',
  /** Tooltip for the "Publish" document action when the document has live edit enabled.*/
  'action.publish.live-edit.tooltip':
    'Live Edit is enabled for this content type and publishing happens automatically as you make changes',
  /** Tooltip when publish button is disabled because there are no changes.*/
  'action.publish.no-changes.tooltip': 'No unpublished changes',
  /** Label for the "Publish" document action when there are no changes.*/
  'action.publish.published.label': 'Published',
  /** Label for the "Publish" document action while publish is being executed.*/
  'action.publish.running.label': 'Publishing…',
  /** Tooltip when the "Publish" document action is disabled due to validation issues */
  'action.publish.validation-issues.tooltip':
    'There are validation errors that need to be fixed before this document can be published',
  /** Tooltip when publish button is waiting for validation and async tasks to complete.*/
  'action.publish.waiting': 'Waiting for tasks to finish before publishing',

  /** Message prompting the user to confirm that they want to restore to an earlier version*/
  'action.restore.confirm-dialog.confirm-discard-changes':
    'Are you sure you want to restore this document?',
  /** Fallback tooltip for when user is looking at the initial version */
  'action.restore.disabled.cannot-restore-initial': "You can't restore to the initial version",

  /** Label for the "Restore" document action */
  'action.restore.label': 'Restore',
  /** Default tooltip for the action */
  'action.restore.tooltip': 'Restore to this version',

  /** Tooltip when action is disabled because the document is not already published */
  'action.unpublish.disabled.not-published': 'This document is not published',
  /** Tooltip when action is disabled because the operation is not ready   */
  'action.unpublish.disabled.not-ready': 'Operation not ready',
  /** Label for the "Unpublish" document action */
  'action.unpublish.label': 'Unpublish',
  /** Fallback tooltip for the Unpublish document action when publish is invoked for a document with live edit enabled.*/
  'action.unpublish.live-edit.disabled':
    'This document has live edit enabled and cannot be unpublished',

  /** The text for the restore button on the deleted document banner */
  'banners.deleted-document-banner.restore-button.text': 'Restore most recent version',
  /** The text content for the deleted document banner */
  'banners.deleted-document-banner.text': 'This document has been deleted.',
  /** The text for the permission check banner if the user only has one role, and it does not allow updating this document */
  'banners.permission-check-banner.missing-permission_create_one':
    'Your role <Roles/> does not have permissions to create this document.',
  /** The text for the permission check banner if the user only has multiple roles, but they do not allow updating this document */
  'banners.permission-check-banner.missing-permission_create_other':
    'Your roles <Roles/> do not have permissions to create this document.',
  /** The text for the permission check banner if the user only has one role, and it does not allow updating this document */
  'banners.permission-check-banner.missing-permission_update_one':
    'Your role <Roles/> does not have permissions to update this document.',
  /** The text for the permission check banner if the user only has multiple roles, but they do not allow updating this document */
  'banners.permission-check-banner.missing-permission_update_other':
    'Your roles <Roles/> do not have permissions to update this document.',
  /** The text for the reload button */
  'banners.reference-changed-banner.reason-changed.reload-button.text': 'Reload reference',
  /** The text for the reference change banner if the reason is that the reference has been changed */
  'banners.reference-changed-banner.reason-changed.text':
    'This reference has changed since you opened it.',
  /** The text for the close button */
  'banners.reference-changed-banner.reason-removed.close-button.text': 'Close reference',
  /** The text for the reference change banner if the reason is that the reference has been deleted */
  'banners.reference-changed-banner.reason-removed.text':
    'This reference has been removed since you opened it.',

  /** The action menu button aria-label */
  'buttons.action-menu-button.aria-label': 'Open document actions',

  /** The aria-label for the split pane button on the document panel header */
  'buttons.split-pane-button.aria-label': 'Split pane right',
  /** The tool tip for the split pane button on the document panel header */
  'buttons.split-pane-button.tooltip': 'Split pane right',
  /** The title for the close button on the split pane on the document panel header */
  'buttons.split-pane-close-button.title': 'Close split pane',
  /** The title for the close group button on the split pane on the document panel header */
  'buttons.split-pane-close-group-button.title': 'Close pane group',

  /** The text in the "Cancel" button in the confirm delete dialog that cancels the action and closes the dialog */
  'confirm-delete-dialog.cancel-button.text': 'Cancel',
  /** Used in `confirm-delete-dialog.cdr-summary.title` */
  'confirm-delete-dialog.cdr-summary.document-count_one': '1 document',
  /** Used in `confirm-delete-dialog.cdr-summary.title` */
  'confirm-delete-dialog.cdr-summary.document-count_other': '{{count}} documents',
  /** The text that appears in the subtitle `<summary>` that lists the datasets below the title */
  'confirm-delete-dialog.cdr-summary.subtitle_one': 'Dataset: {{datasets}}',
  /** The text that appears in the subtitle `<summary>` that lists the datasets below the title */
  'confirm-delete-dialog.cdr-summary.subtitle_other': 'Datasets: {{datasets}}',
  /** The text that appears in the subtitle `<summary>` that lists the datasets below the title */
  'confirm-delete-dialog.cdr-summary.subtitle_unavailable_one': 'Unavailable dataset',
  /** The text that appears in the subtitle `<summary>` that lists the datasets below the title */
  'confirm-delete-dialog.cdr-summary.subtitle_unavailable_other': 'Unavailable datasets',
  /** The text that appears in the title `<summary>` that includes the list of CDRs (singular) */
  'confirm-delete-dialog.cdr-summary.title_one': '{{documentCount}} in another dataset',
  /** The text that appears in the title `<summary>` that includes the list of CDRs (plural) */
  'confirm-delete-dialog.cdr-summary.title_other': '{{documentCount}} in {{count}} datasets',
  /** Appears when hovering over the copy button to copy */
  'confirm-delete-dialog.cdr-table.copy-id-button.tooltip': 'Copy ID to clipboard',
  /** The header for the dataset column in the list of cross-dataset references found */
  'confirm-delete-dialog.cdr-table.dataset.label': 'Dataset',
  /** The header for the document ID column in the list of cross-dataset references found */
  'confirm-delete-dialog.cdr-table.document-id.label': 'Document ID',
  /** The toast title when the copy button has been clicked */
  'confirm-delete-dialog.cdr-table.id-copied-toast.title': 'Copied document ID to clipboard!',
  /** The header for the project ID column in the list of cross-dataset references found */
  'confirm-delete-dialog.cdr-table.project-id.label': 'Project ID',
  /** The text in the "Delete anyway" button in the confirm delete dialog that confirms the action */
  'confirm-delete-dialog.confirm-anyway-button.text_delete': 'Delete anyway',
  /** The text in the "Unpublish anyway" button in the confirm delete dialog that confirms the action */
  'confirm-delete-dialog.confirm-anyway-button.text_unpublish': 'Unpublish anyway',
  /** The text in the "Delete now" button in the confirm delete dialog that confirms the action */
  'confirm-delete-dialog.confirm-button.text_delete': 'Delete now',
  /** The text in the "Unpublish now" button in the confirm delete dialog that confirms the action */
  'confirm-delete-dialog.confirm-button.text_unpublish': 'Unpublish now',
  /** If no referring documents are found, this text appears above the cancel and confirmation buttons */
  'confirm-delete-dialog.confirmation.text_delete':
    'Are you sure you want to delete “<DocumentTitle/>”?',
  /** If no referring documents are found, this text appears above the cancel and confirmation buttons */
  'confirm-delete-dialog.confirmation.text_unpublish':
    'Are you sure you want to unpublish “<DocumentTitle/>”?',
  /** The text body of the error dialog. */
  'confirm-delete-dialog.error.message.text':
    'An error occurred while loading referencing documents.',
  /** The text in the retry button of the confirm delete dialog if an error occurred. */
  'confirm-delete-dialog.error.retry-button.text': 'Retry',
  /** The header of the confirm delete dialog if an error occurred while the confirm delete dialog was open. */
  'confirm-delete-dialog.error.title.text': 'Error',
  /** The header of the confirm delete dialog */
  'confirm-delete-dialog.header.text_delete': 'Delete document?',
  /** The header of the confirm delete dialog */
  'confirm-delete-dialog.header.text_unpublish': 'Unpublish document?',
  /** The text that appears while the referring documents are queried */
  'confirm-delete-dialog.loading.text': 'Looking for referring documents…',
  /** Shown if there are references to other documents but the user does not have the permission to see the relevant document IDs */
  'confirm-delete-dialog.other-reference-count.title_one': '1 other reference not show',
  /** Shown if there are references to other documents but the user does not have the permission to see the relevant document IDs */
  'confirm-delete-dialog.other-reference-count.title_other': '{{count}} other references not shown',
  /** Text in the tooltip of this component if hovering over the info icon */
  'confirm-delete-dialog.other-reference-count.tooltip':
    "We can't display metadata for these references due to a missing access token for the related datasets.",
  /** Appears when unable to render a document preview in the referring document list */
  'confirm-delete-dialog.preview-item.preview-unavailable.subtitle': 'ID: {{documentId}}',
  /** Appears when unable to render a document preview in the referring document list */
  'confirm-delete-dialog.preview-item.preview-unavailable.title': 'Preview unavailable',
  /** Warns the user of affects to other documents if the action is confirmed (delete) */
  'confirm-delete-dialog.referential-integrity-disclaimer.text_delete':
    'If you delete this document, documents that refer to it will no longer be able to access it.',
  /** Warns the user of affects to other documents if the action is confirmed (unpublish) */
  'confirm-delete-dialog.referential-integrity-disclaimer.text_unpublish':
    'If you unpublish this document, documents that refer to it will no longer be able to access it.',
  /** Tells the user the count of how many other referring documents there are before listing them. (singular) */
  'confirm-delete-dialog.referring-document-count.text_one':
    '1 document refers to “<DocumentTitle/>”',
  /** Tells the user the count of how many other referring documents there are before listing them. (plural) */
  'confirm-delete-dialog.referring-document-count.text_other':
    '{{count}} documents refer to “<DocumentTitle/>”',
  /** Describes the list of documents that refer to the one trying to be deleted (delete) */
  'confirm-delete-dialog.referring-documents-descriptor.text_delete':
    'You may not be able to delete “<DocumentTitle/>” because the following documents refer to it:',
  /** Describes the list of documents that refer to the one trying to be deleted (unpublish) */
  'confirm-delete-dialog.referring-documents-descriptor.text_unpublish':
    'You may not be able to unpublish “<DocumentTitle/>” because the following documents refer to it:',

  /** The text shown if there was an error while getting the document's title via a preview value */
  'doc-title.error.text': 'Error: {{errorMessage}}',
  /** The text shown if the preview value for a document is non-existent or empty */
  'doc-title.fallback.text': 'Untitled',
  /** The text shown if a document's title via a preview value cannot be determined due to an unknown schema type */
  'doc-title.unknown-schema-type.text': 'Unknown schema type: {{schemaType}}',

  /** The title shown in the dialog header, when inspecting a valid document */
  'document-inspector.dialog.title': 'Inspecting <DocumentTitle/>',
  /** The title shown in the dialog header, when the document being inspected is not created yet/has no value */
  'document-inspector.dialog.title-no-value': 'No value',
  /** Title shown for menu item that opens the "Inspect" dialog */
  'document-inspector.menu-item.title': 'Inspect',
  /** the placeholder text for the search input on the inspect dialog */
  'document-inspector.search.placeholder': 'Search',
  /** The "parsed" view mode, meaning the JSON is searchable, collapsible etc */
  'document-inspector.view-mode.parsed': 'Parsed',
  /** The "raw" view mode, meaning the JSON is presented syntax-highlighted, but with no other features - optimal for copying */
  'document-inspector.view-mode.raw-json': 'Raw JSON',

  /** The text for when a form is hidden */
  'document-view.form-view.form-hidden': 'This form is hidden',
  /** The text for when the form view is loading a document */
  'document-view.form-view.loading': 'Loading document…',
  /** The description of the sync lock toast on the form view */
  'document-view.form-view.sync-lock-toast.description':
    'Please hold tight while the document is synced. This usually happens right after the document has been published, and it should not take more than a few seconds',
  /** The title of the sync lock toast on the form view */
  'document-view.form-view.sync-lock-toast.title': 'Syncing document…',

  /** The loading messaging for when the tooltip is still loading permission info */
  'insufficient-permissions-message-tooltip.loading-text': 'Loading…',

  /** The link text of the no document type screen that appears directly below the subtitle */
  'no-document-types-screen.link-text': 'Learn how to add a document type →',
  /** The subtitle of the no document type screen that appears directly below the title */
  'no-document-types-screen.subtitle': 'Please define at least one document type in your schema.',

  /** The title of the no document type screen */
  'no-document-types-screen.title': 'No document types',

  /** tooltip text (via `title` attribute) for the menu button */
  'pane-header.context-menu-button.tooltip': 'Show menu',
  /** Appears in a document list pane header if there are more than one option for create. This is the label for that menu */
  'pane-header.create-menu.label': 'Create',
  /** The `aria-label` for the disabled button in the pane header if create permissions are granted */
  'pane-header.disabled-created-button.aria-label': 'Insufficient permissions',

  /** The text shown in the tooltip of pane item previews of documents if there are unpublished edits */
  'pane-item.draft-status.has-draft.tooltip': 'Edited <RelativeTime/>',
  /** The text shown in the tooltip of pane item previews of documents if there are no unpublished edits */
  'pane-item.draft-status.no-draft.tooltip': 'No unpublished edits',
  /** The subtitle tor pane item previews if there isn't a matching schema type found */
  'pane-item.missing-schema-type.subtitle': 'Document: <Code>{{documentId}}</Code>',
  /** The title tor pane item previews if there isn't a matching schema type found */
  'pane-item.missing-schema-type.title': 'No schema found for type <Code>{{documentType}}</Code>',
  /** The text shown in the tooltip of pane item previews of documents if there are unpublished edits */
  'pane-item.published-status.has-published.tooltip': 'Published <RelativeTime/>',
  /** The text shown in the tooltip of pane item previews of documents if there are no unpublished edits */
  'pane-item.published-status.no-published.tooltip': 'No unpublished edits',

  /** The text used in the document header title if there is an error */
  'panes.document-header-title.error.text': 'Error: {{error}}',
  /** The text used in the document header title if creating a new item */
  'panes.document-header-title.new.text': 'New {{schemaType}}',
  /** The text used in the document header title if no other title can be determined */
  'panes.document-header-title.untitled.text': 'Untitled',
  /** The text for the retry button on the document list pane */
  'panes.document-list-pane.error.retry-button.text': 'Retry',
  /** The error text on the document list pane */
  'panes.document-list-pane.error.text': 'Error: <Code>{{error}}</Code>',
  /** The error title on the document list pane */
  'panes.document-list-pane.error.title': 'Could not fetch list items',
  /** The text of the document list pane if more than a maximum number of documents are returned */
  'panes.document-list-pane.max-items.text': 'Displaying a maximum of {{limit}} documents',
  /** The text of the document list pane if no documents are found for a specified type */
  'panes.document-list-pane.no-documents-of-type.text': 'No documents of this type',
  /** The text of the document list pane if no documents are found */
  'panes.document-list-pane.no-documents.text': 'No results found',
  /** The text of the document list pane if no documents are found matching specified criteria */
  'panes.document-list-pane.no-matching-documents.text': 'No matching documents',
  /** The aria-label for the search input on the document list pane */
  'panes.document-list-pane.search-input.aria-label': 'Search list',
  /** The search input for the search input on the document list pane */
  'panes.document-list-pane.search-input.placeholder': 'Search list',
  /** The summary title when displaying an error for a document operation result */
  'panes.document-operation-results.error.summary.title': 'Details',
  /** The text when a generic operation failed (fallback, generally not shown)  */
  'panes.document-operation-results.operation-error': 'An error occurred during {{context}}',
  /** The text when a delete operation failed  */
  'panes.document-operation-results.operation-error_delete':
    'An error occurred while attempting to delete this document. This usually means that there are other documents that refers to it.',
  /** The text when an unpublish operation failed  */
  'panes.document-operation-results.operation-error_unpublish':
    'An error occurred while attempting to unpublish this document. This usually means that there are other documents that refers to it.',
  /** The text when a generic operation succeded (fallback, generally not shown)  */
  'panes.document-operation-results.operation-success':
    'Successfully performed {{context}} on document',
  /** The text when a delete operation succeded  */
  'panes.document-operation-results.operation-success_delete':
    'The document was successfully deleted',
  /** The text when a discard changes operation succeeded  */
  'panes.document-operation-results.operation-success_discardChanges':
    'All changes since last publish has now been discarded. The discarded draft can still be recovered from history',
  /** The text when a publish operation succeeded  */
  'panes.document-operation-results.operation-success_publish': 'The document was published',
  /** The text when an unpublish operation succeeded  */
  'panes.document-operation-results.operation-success_unpublish':
    'The document was unpublished. A draft has been created from the latest published version.',
  /** The title of the reconnecting toast */
  'panes.document-pane-provider.reconnecting.title': 'Connection lost. Reconnecting…',
  /** The loading message for the document not found pane */
  'panes.document-pane.document-not-found.loading': 'Loading document…',
  /** The text of the document not found pane if the schema is known */
  'panes.document-pane.document-not-found.text':
    'The document type is not defined, and a document with the <Code>{{id}}</Code> identifier could not be found.',
  /** The title of the document not found pane if the schema is known */
  'panes.document-pane.document-not-found.title': 'The document was not found',
  /** The text of the document not found pane if the schema is not found */
  'panes.document-pane.document-unknown-type.text':
    'This document has the schema type <Code>{{documentType}}</Code>, which is not defined as a type in the local content studio schema.',
  /** The title of the document not found pane if the schema is not found or unknown */
  'panes.document-pane.document-unknown-type.title':
    'Unknown document type: <Code>{{documentType}}</Code>',
  /** The title of the document not found pane if the schema is unknown */
  'panes.document-pane.document-unknown-type.without-schema.text':
    'This document does not exist, and no schema type was specified for it.',
  /** The text to display when type is missing */
  'panes.unknown-pane-type.missing-type.text':
    'Structure item is missing required <Code>type</Code> property.',
  /** The title of the unknown pane */
  'panes.unknown-pane-type.title': 'Unknown pane type',
  /** The text to display when type is unknown */
  'panes.unknown-pane-type.unknown-type.text':
    'Structure item of type <Code>{{type}}</Code> is not a known entity.',

  /** The text for the "Open preview" action for a document */
  'production-preview.menu-item.title': 'Open preview',

  /** Accessibility label indicating when the document was last published, in relative time, eg "3 weeks ago" */
  'status-bar.publish-status-button.last-published-time.aria-label':
    'Last published {{relativeTime}}',
  /** Text for tooltip showing explanation of timestamp/relative time, eg "Last published <RelativeTime/>" */
  'status-bar.publish-status-button.last-published-time.tooltip': 'Last published <RelativeTime/>',
  /** Accessibility label indicating when the document was last updated, in relative time, eg "2 hours ago" */
  'status-bar.publish-status-button.last-updated-time.aria-label': 'Last updated {{relativeTime}}',
  /** Text for tooltip showing explanation of timestamp/relative time, eg "Last updated <RelativeTime/>" */
  'status-bar.publish-status-button.last-updated-time.tooltip': 'Last updated <RelativeTime/>',
  /** Aria label for the button */
  'status-bar.review-changes-button.aria-label': 'Review changes',
  /** Label for button when status is saved */
  'status-bar.review-changes-button.status.saved.text': 'Saved!',
  /** Label for button when status is syncing */
  'status-bar.review-changes-button.status.syncing.text': 'Saving...',
  /** Text for the secondary text for tooltip for the button */
  'status-bar.review-changes-button.tooltip.changes-saved': 'Changes saved',
  /** Primary text for tooltip for the button */
  'status-bar.review-changes-button.tooltip.text': 'Review changes',

  /** The text that appears in side the documentation link */
  'structure-error.docs-link.text': 'View documentation',
  /** Labels the error message or error stack of the structure error screen */
  'structure-error.error.label': 'Error',
  /** The header that appears at the top of the error screen */
  'structure-error.header.text': 'Encountered an error while reading structure',
  /** The text in the reload button to retry rendering the structure */
  'structure-error.reload-button.text': 'Reload',
  /** Labels the structure path of the structure error screen */
  'structure-error.structure-path.label': 'Structure path',
})

/**
 * @alpha
 */
export type StructureLocaleResourceKeys = keyof typeof structureLocaleStrings

export default structureLocaleStrings
