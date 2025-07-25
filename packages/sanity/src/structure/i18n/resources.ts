/* eslint sort-keys: "error" */
import {defineLocalesResources} from 'sanity'

/**
 * Defined locale strings for the structure tool, in US English.
 *
 * @internal
 */
const structureLocaleStrings = defineLocalesResources('structure', {
  /** Label for the "Copy Document URL" document action */
  'action.copy-document-url.label': 'Copy Document URL',
  /** Tooltip when action button is disabled because the operation is not ready   */
  'action.delete.disabled.not-ready': 'Operation not ready',
  /** Tooltip when action button is disabled because the document does not exist */
  'action.delete.disabled.nothing-to-delete':
    "This document doesn't yet exist or is already deleted",
  /** Label for the "Delete" document action button */
  'action.delete.label': 'Delete',
  /** Label for the "Delete" document action while the document is being deleted */
  'action.delete.running.label': 'Deleting…',
  /** Tooltip when action is disabled because the document is linked to Canvas */
  'action.disabled-by-canvas.tooltip':
    'Some document actions are disabled for documents linked to Canvas',
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
  'action.publish.already-published.tooltip': 'Published {{timeSincePublished}}',

  /** Tooltip when action is disabled because the studio is not ready.*/
  'action.publish.disabled.not-ready': 'Operation not ready',
  /** Label for action when there are pending changes.*/
  'action.publish.draft.label': 'Publish',
  /** Label for the "Publish" document action */
  'action.publish.label': 'Publish',
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

  /** Message prompting the user to confirm that they want to restore to an earlier revision*/
  'action.restore.confirm.message': 'Are you sure you want to restore this document?',
  /** Fallback tooltip for when user is looking at the initial revision */
  'action.restore.disabled.cannot-restore-initial': "You can't restore to the initial revision",

  /** Label for the "Restore" document action */
  'action.restore.label': 'Revert to revision',
  /** Default tooltip for the action */
  'action.restore.tooltip': 'Restore to this revision',

  /** Tooltip when action is disabled because the document is not already published */
  'action.unpublish.disabled.not-published': 'This document is not published',
  /** Tooltip when action is disabled because the operation is not ready   */
  'action.unpublish.disabled.not-ready': 'Operation not ready',
  /** Label for the "Unpublish" document action */
  'action.unpublish.label': 'Unpublish',
  /** Fallback tooltip for the Unpublish document action when publish is invoked for a document with live edit enabled.*/
  'action.unpublish.live-edit.disabled':
    'This document has live edit enabled and cannot be unpublished',
  /** Description for the archived release banner, rendered when viewing the history of a version document from the publihed view */
  'banners.archived-release.description':
    'This document version belongs to the archived <VersionBadge>{{title}}</VersionBadge> release',
  /** The explanation displayed when a user attempts to create a new draft document, but the draft model is not switched on */
  'banners.choose-new-document-destination.cannot-create-draft-document':
    'Cannot create a draft document.',
  /** The explanation displayed when a user attempts to create a new published document, but the schema type doesn't support live-editing */
  'banners.choose-new-document-destination.cannot-create-published-document':
    'Cannot create a published document.',
  /** The prompt displayed when a user must select a different perspective in order to create a document */
  'banners.choose-new-document-destination.choose-destination':
    'Choose a destination for this document:',
  /** The explanation displayed when a user attempts to create a new document in a release, but the selected release is inactive */
  'banners.choose-new-document-destination.release-inactive':
    'The <VersionBadge>{{title}}</VersionBadge> release is not active.',
  /** The text for the restore button on the deleted document banner */
  'banners.deleted-document-banner.restore-button.text': 'Restore most recent revision',
  /** The text content for the deleted document banner */
  'banners.deleted-document-banner.text': 'This document has been deleted.',
  /** The text content for the deprecated document type banner */
  'banners.deprecated-document-type-banner.text': 'This document type has been deprecated.',
  /** The text for publish action for discarding the version */
  'banners.live-edit-draft-banner.discard.tooltip': 'Discard draft to continue editing.',
  /** The text for publish action for the draft banner */
  'banners.live-edit-draft-banner.publish.tooltip': 'Publish draft to continue editing.',

  /** The text content for the live edit document when it's a draft */
  'banners.live-edit-draft-banner.text':
    'The type <strong>{{schemaType}}</strong> has <code>liveEdit</code> enabled, but a draft version of this document exists. Publish or discard the draft in order to continue live editing it.',
  /** The label for the "compare draft" action */
  'banners.obsolete-draft.actions.compare-draft.text': 'Compare draft',
  /** The label for the "discard draft" action */
  'banners.obsolete-draft.actions.discard-draft.text': 'Discard draft',
  /** The label for the "publish draft" action */
  'banners.obsolete-draft.actions.publish-draft.text': 'Publish draft',
  /** The warning displayed when editing a document that has an obsolete draft because the draft model is not switched on */
  'banners.obsolete-draft.draft-model-inactive.text':
    'The workspace does not have drafts enabled, but a draft version of this document exists.',
  /** The text for the permission check banner if the user only has one role, and it does not allow publishing this document */
  'banners.permission-check-banner.missing-permission_create_one':
    'Your role <Roles/> does not have permission to publish this document.',
  /** The text for the permission check banner if the user only has multiple roles, but they do not allow publishing this document */
  'banners.permission-check-banner.missing-permission_create_other':
    'Your roles <Roles/> do not have permission to publish this document.',
  /** The text for the permission check banner if the user only has one role, and it does not allow editing this document */
  'banners.permission-check-banner.missing-permission_update_one':
    'Your role <Roles/> does not have permission to edit this document.',
  /** The text for the permission check banner if the user only has multiple roles, but they do not allow editing this document */
  'banners.permission-check-banner.missing-permission_update_other':
    'Your roles <Roles/> do not have permission to edit this document.',
  /** The pending text for the request permission button that appears for viewer roles */
  'banners.permission-check-banner.request-permission-button.sent': 'Editor request sent',
  /** The text for the request permission button that appears for viewer roles */
  'banners.permission-check-banner.request-permission-button.text': 'Ask to edit',
  /** Description for the archived release banner, rendered when viewing the history of a version document from the published view */
  'banners.published-release.description':
    "You are viewing a read-only document that was published as part of <VersionBadge>{{title}}</VersionBadge>. It can't be edited",
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
  /** The text that appears for the action button to add the current document to the global release */
  'banners.release.action.add-to-release': 'Add to release',
  /** The text that appears for the action button to add the current document to the global release */
  'banners.release.action.open-to-edit': 'Open release to edit',
  /** Toast description in case an error occurs when adding a document to a release  */
  'banners.release.error.description':
    'An error occurred when adding document to the release: {{message}}',
  /** Toast title in case an error occurs when adding a document to a release  */
  'banners.release.error.title': 'Error adding document to release',
  /** The text for the banner that appears when a document only has versions but is in a draft or published pinned release */
  'banners.release.navigate-to-edit-description': 'The document only exists in the',
  /** The text for the banner that appears when a document only has versions but is in a draft or published pinned release */
  'banners.release.navigate-to-edit-description-end_one': 'release',
  /** The text for the banner that appears when a document only has versions but is in a draft or published pinned release */
  'banners.release.navigate-to-edit-description-end_other': 'releases',
  /** The text for the banner that appears when there are multiple versions but no drafts or published, only one extra releases */
  'banners.release.navigate-to-edit-description-multiple_one':
    'This document is part of the <VersionBadge/> release and {{count}} more release.',
  /** The text for the banner that appears when there are multiple versions but no drafts or published, more than one extra releases */
  'banners.release.navigate-to-edit-description-multiple_other':
    'This document is part of the <VersionBadge/> release and {{count}} more releases',
  /** The text for the banner that appears when a document only has one version but is in a draft or published pinned release */
  'banners.release.navigate-to-edit-description-single':
    'This document is part of the <VersionBadge/> release',
  /** The text for the banner that appears when a document is not in the current global release */
  'banners.release.not-in-release': 'Not in the <VersionBadge>{{title}}</VersionBadge> release.',
  /** Description of toast that will appear in case of latency between the user adding a document to a release and the UI reflecting it */
  'banners.release.waiting.description':
    'Please hold tight while the document is added to the release. It should not take longer than a few seconds.',
  /** Title of toast that will appear in case of latency between the user adding a document to a release and the UI reflecting it */
  'banners.release.waiting.title': 'Adding document to release…',
  /** The text for the revision not found banner */
  'banners.revision-not-found.description':
    "We couldn't find the document revision selected, please select another entry from the history list.",
  /** The text content for the unpublished document banner when is part of a release */
  'banners.unpublished-release-banner.text':
    'This document will be unpublished as part of the <VersionBadge>{{title}}</VersionBadge> release.',
  /** The text content for the unpublished document banner letting the user know that the current published version is being shown */
  'banners.unpublished-release-banner.text-with-published':
    'Showing the current <strong>published</strong> version:',
  /** Browser/tab title when creating a new document of a given type */
  'browser-document-title.new-document': 'New {{schemaType}}',
  /** Browser/tab title when editing a document where the title cannot be resolved from preview configuration */
  'browser-document-title.untitled-document': 'Untitled',

  /** The action menu button aria-label */
  'buttons.action-menu-button.aria-label': 'Open document actions',
  /** The action menu button tooltip */
  'buttons.action-menu-button.tooltip': 'Document actions',

  /** The aria-label for the split pane button on the document panel header */
  'buttons.split-pane-button.aria-label': 'Split pane right',
  /** The tool tip for the split pane button on the document panel header */
  'buttons.split-pane-button.tooltip': 'Split pane right',
  /** The title for the close button on the split pane on the document panel header */
  'buttons.split-pane-close-button.title': 'Close split pane',
  /** The title for the close group button on the split pane on the document panel header */
  'buttons.split-pane-close-group-button.title': 'Close pane group',

  /** The text for the canvas linked banner action button */
  'canvas.banner.edit-in-canvas-action': 'Edit in Canvas',
  /** The text for the canvas linked banner when the document is a draft */
  'canvas.banner.linked-text.draft': 'This draft document is linked to Canvas',
  /** The text for the canvas linked banner when the document is a live document */
  'canvas.banner.linked-text.published': 'This live document is linked to Canvas',
  /** The text for the canvas linked banner when the document is a version document */
  'canvas.banner.linked-text.version': 'This version document is linked to Canvas',
  /** The text for the canvas linked banner popover button */
  'canvas.banner.popover-button-text': 'Learn more',
  /** The description for the canvas linked banner popover */
  'canvas.banner.popover-description':
    'Canvas lets you author in a free-form editor that automatically maps back to the Studio as structured content - as you type.',
  /** The heading for the canvas linked banner popover */
  'canvas.banner.popover-heading': 'Idea first authoring',
  /** The description for the changes banner */
  'changes.banner.description':
    'Showing the history for the <strong>{{perspective}}</strong> version of this document.',
  /** The tooltip for the changes banner */
  'changes.banner.tooltip':
    'This view shows the changes that occurred in a specific version of this document. Select a different version to see its changes',
  /** The label used in the changes inspector for the from selector */
  'changes.from.label': 'From',
  /* The label for the history tab in the changes inspector*/
  'changes.tab.history': 'History',
  /* The label for the review tab in the changes inspector*/
  'changes.tab.review-changes': 'Review changes',
  /** The label used in the changes inspector for the to selector */
  'changes.to.label': 'To',

  /** The error message shown when the specified document comparison mode is not supported */
  'compare-version.error.invalidModeParam':
    '"{{input}}" is not a supported document comparison mode.',
  /** The error message shown when the next document for comparison could not be extracted from the URL */
  'compare-version.error.invalidNextDocumentParam': 'The next document parameter is invalid.',
  /** The error message shown when the document comparison URL could not be parsed */
  'compare-version.error.invalidParams.title': 'Unable to compare documents',
  /** The error message shown when the previous document for comparison could not be extracted from the URL */
  'compare-version.error.invalidPreviousDocumentParam':
    'The previous document parameter is invalid.',
  /** The text for the tooltip when the "Compare versions" action for a document is disabled */
  'compare-versions.menu-item.disabled-reason':
    'There are no other versions of this document to compare.',
  /** The text for the "Compare versions" action for a document */
  'compare-versions.menu-item.title': 'Compare versions',
  /** The string used to label draft documents */
  'compare-versions.status.draft': 'Draft',
  /** The string used to label published documents */
  'compare-versions.status.published': 'Published',
  /** The title used when comparing versions of a document */
  'compare-versions.title': 'Compare versions',

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
  /** The toast title when the copy button has been clicked but copying failed */
  'confirm-delete-dialog.cdr-table.id-copied-toast.title-failed': 'Failed to copy document ID',
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

  /** The text for the cancel button in the confirm dialog used in document action shortcuts if none is provided */
  'confirm-dialog.cancel-button.fallback-text': 'Cancel',
  /** The text for the confirm button in the confirm dialog used in document action shortcuts if none is provided */
  'confirm-dialog.confirm-button.fallback-text': 'Confirm',

  /** For the default structure definition, the title for the "Content" pane */
  'default-definition.content-title': 'Content',

  /** The text shown if there was an error while getting the document's title via a preview value */
  'doc-title.error.text': 'Error: {{errorMessage}}',
  /** The text shown if the preview value for a document is non-existent or empty */
  'doc-title.fallback.text': 'Untitled',
  /** The text shown if a document's title via a preview value cannot be determined due to an unknown schema type */
  'doc-title.unknown-schema-type.text': 'Unknown schema type: {{schemaType}}',

  /** Tooltip text shown for the close button of the document inspector */
  'document-inspector.close-button.tooltip': 'Close',
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
  /** Fallback title shown when a form title is not provided */
  'document-view.form-view.form-title-fallback': 'Untitled',
  /** The text for when the form view is loading a document */
  'document-view.form-view.loading': 'Loading document…',
  /** The description of the sync lock toast on the form view */
  'document-view.form-view.sync-lock-toast.description':
    'Please hold tight while the document is synced. This usually happens right after the document has been published, and it should not take more than a few seconds',
  /** The title of the sync lock toast on the form view */
  'document-view.form-view.sync-lock-toast.title': 'Syncing document…',

  /** The description for the document favorite action */
  'document.favorites.add-to-favorites': 'Add to favorites',
  /** The description for the document unfavorite action */
  'document.favorites.remove-from-favorites': 'Remove from favorites',

  /** The description for the events inspector when we can't load the document so we default to compare with published */
  'events.compare-with-published.description':
    "We're unable to load the changes for this document, probably due to history retention policy of your plan, this shows you how the <strong>{{version}}</strong> version compares to the <strong>published</strong> version.",

  /** The title for the events inspector when we can't load the document so we default to compare with published */
  'events.compare-with-published.title': 'Comparing with published',

  /**The title for the menu items that will be shown when expanding a publish release event to inspect the document */
  'events.inspect.release': 'Inspect <VersionBadge>{{releaseTitle}}</VersionBadge> document',
  /**The title for the menu items that will be shown when expanding a publish draft event to inspect the draft document*/
  'events.open.draft': 'Open <VersionBadge>draft</VersionBadge> document',
  /**The title for the menu items that will be shown when expanding a publish release event to inspect the release*/
  'events.open.release': 'Open <VersionBadge>{{releaseTitle}}</VersionBadge> release',
  /** The loading messaging for when the tooltip is still loading permission info */
  'insufficient-permissions-message-tooltip.loading-text': 'Loading…',

  /** --- Menu items --- */
  /** The menu item group title to use for the Action menu items */
  'menu-item-groups.actions-group': 'Actions',
  /** The menu item group title to use for the Layout menu items */
  'menu-item-groups.layout-group': 'Layout',
  /** The menu item group title to use for the Sort menu items */
  'menu-item-groups.sorting-group': 'Sort',

  /** The menu item title to use the compact view */
  'menu-items.layout.compact-view': 'Compact view',
  /** The menu item title to use the detailed view */
  'menu-items.layout.detailed-view': 'Detailed view',
  /** The menu item title to Sort by Created */
  'menu-items.sort-by.created': 'Sort by Created',
  /** The menu item title to Sort by Last Edited */
  'menu-items.sort-by.last-edited': 'Sort by Last Edited',

  /** The link text of the no document type screen that appears directly below the subtitle */
  'no-document-types-screen.link-text': 'Learn how to add a document type →',
  /** The subtitle of the no document type screen that appears directly below the title */
  'no-document-types-screen.subtitle': 'Please define at least one document type in your schema.',

  /** The title of the no document type screen */
  'no-document-types-screen.title': 'No document types',

  /** Text shown on back button visible on smaller breakpoints */
  'pane-header.back-button.text': 'Back',
  /** tooltip text (via `title` attribute) for the menu button */
  'pane-header.context-menu-button.tooltip': 'Show menu',
  /** Appears in a document list pane header if there are more than one option for create. This is the label for that menu */
  'pane-header.create-menu.label': 'Create',
  /** Tooltip displayed on the create new button in document lists */
  'pane-header.create-new-button.tooltip': 'Create new document',
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
  /** The help text saying that we have given up on automatic retry */
  'panes.document-list-pane.error.max-retries-attempted':
    'Not automatically retrying after {{count}} unsuccessful attempts.',
  /** The help text saying that we'll retry fetching the document list */
  'panes.document-list-pane.error.retrying': 'Retrying…',
  /** The error text on the document list pane */
  'panes.document-list-pane.error.text': 'Encountered an error while fetching documents.',
  /** The error text on the document list pane */
  'panes.document-list-pane.error.text.dev': 'Error: <Code>{{error}}</Code>',
  /** The error text on the document list pane if the browser appears to be offlline */
  'panes.document-list-pane.error.text.offline': 'The Internet connection appears to be offline.',
  /** The error title on the document list pane */
  'panes.document-list-pane.error.title': 'Could not fetch list items',
  /** The help text saying that we'll retry fetching the document list */
  'panes.document-list-pane.error.will-retry-automatically_one': 'Retrying…',
  'panes.document-list-pane.error.will-retry-automatically_other': 'Retrying… (#{{count}}).',
  /** The text of the document list pane if more than a maximum number of documents are returned */
  'panes.document-list-pane.max-items.text': 'Displaying a maximum of {{limit}} documents',
  /** The text of the document list pane if no documents are found for a specified type */
  'panes.document-list-pane.no-documents-of-type.text': 'No documents of this type',
  /** The text of the document list pane if no documents are found */
  'panes.document-list-pane.no-documents.text': 'No results found',
  /** The text of the document list pane if no documents are found matching specified criteria */
  'panes.document-list-pane.no-matching-documents.text': 'No matching documents',
  /** The search input for the search input on the document list pane */
  'panes.document-list-pane.reconnecting': 'Trying to connect…',
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
  /** The text when a generic operation succeeded (fallback, generally not shown)  */
  'panes.document-operation-results.operation-success': 'Successfully performed {{op}} on document',
  /** The text when copy URL operation succeeded  */
  'panes.document-operation-results.operation-success_copy-url': 'Document URL copied to clipboard',
  /**  */
  'panes.document-operation-results.operation-success_createVersion':
    '<Strong>{{title}}</Strong> was added to the release',
  /** The text when a delete operation succeeded  */
  'panes.document-operation-results.operation-success_delete':
    'The document was successfully deleted',
  /** The text when a discard changes operation succeeded  */
  'panes.document-operation-results.operation-success_discardChanges':
    'All changes since last publish has now been discarded. The discarded draft can still be recovered from history',
  /** The text when a duplicate operation succeeded  */
  'panes.document-operation-results.operation-success_duplicate':
    'The document was successfully duplicated',
  /** The text when a publish operation succeeded  */
  'panes.document-operation-results.operation-success_publish':
    '<Strong>{{title}}</Strong> was published',
  /** The text when a restore operation succeeded  */
  'panes.document-operation-results.operation-success_restore':
    '<Strong>{{title}}</Strong> was restored',
  /** The text when an unpublish operation succeeded  */
  'panes.document-operation-results.operation-success_unpublish':
    '<Strong>{{title}}</Strong> was unpublished. A draft has been created from the latest published revision.',
  /** The document title shown when document title is "undefined" in operation message */
  'panes.document-operation-results.operation-undefined-title': 'Untitled',
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
  /** Default message shown while resolving the structure definition for an asynchronous node */
  'panes.resolving.default-message': 'Loading…',
  /** Message shown while resolving the structure definition for an asynchronous node and it is taking a while (more than 5s) */
  'panes.resolving.slow-resolve-message': 'Still loading…',
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

  /** The text for the confirm button in the request permission dialog used in the permissions banner */
  'request-permission-dialog.confirm-button.text': 'Send request',
  /** The description text for the request permission dialog used in the permissions banner */
  'request-permission-dialog.description.text':
    "Your request will be sent to the project administrator(s). If you'd like, you can also include a note",
  /** The header/title for the request permission dialog used in the permissions banner */
  'request-permission-dialog.header.text': 'Ask for edit access',
  /** The text describing the note input for the request permission dialog used in the permissions banner */
  'request-permission-dialog.note-input.description.text': "If you'd like, you can add a note",
  /** The placeholder for the note input in the request permission dialog used in the permissions banner */
  'request-permission-dialog.note-input.placeholder.text': 'Add note...',
  /** The error/warning text in the request permission dialog when the user's request has been declined */
  'request-permission-dialog.warning.denied.text':
    'Your request to access this project has been declined.',
  /** The error/warning text in the request permission dialog when the user's request has been denied due to too many outstanding requests */
  'request-permission-dialog.warning.limit-reached.text':
    "You've reached the limit for role requests across all projects. Please wait before submitting more requests or contact an administrator for assistance.",

  /** Label for button when status is saved */
  'status-bar.document-status-pulse.status.saved.text': 'Saved',
  /** Label for button when status is syncing */
  'status-bar.document-status-pulse.status.syncing.text': 'Saving...',
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

  /** The aria label for the menu button in the timeline item */
  'timeline-item.menu-button.aria-label': 'Open action menu',
  /** The text for the tooltip in menu button the timeline item */
  'timeline-item.menu-button.tooltip': 'Actions',
  /** The text for the collapse action in the timeline item menu */
  'timeline-item.menu.action-collapse': 'Collapse',
  /** The text for the expand action in the timeline item menu */
  'timeline-item.menu.action-expand': 'Expand',

  /** The text for the published event menu tooltip when the release is not found */
  'timeline-item.not-found-release.tooltip': 'Release with id "{{releaseId}}" not found',
})

/**
 * @alpha
 */
export type StructureLocaleResourceKeys = keyof typeof structureLocaleStrings

export default structureLocaleStrings
