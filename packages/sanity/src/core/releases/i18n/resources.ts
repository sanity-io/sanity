/**
 * Defined locale strings for the releases tool, in US English.
 *
 * @internal
 */
const releasesLocaleStrings = {
  /** Action text for adding a document to release */
  'action.add-document': 'Add document',
  /** Action text for archiving a release */
  'action.archive': 'Archive release',
  /** Tooltip for when the archive release action is disabled due to release being scheduled  */
  'action.archive.tooltip': 'Unschedule this release to archive it',
  /** Action text for showing the archived releases */
  'action.archived': 'Archived',
  /** Action text for comparing document versions */
  'action.compare-versions': 'Compare versions',
  /** Action text for deleting a release */
  'action.delete': 'Delete',
  /** Description for toast when release deletion failed */
  'action.delete.failure': 'Failed to delete release',
  /** Description for toast when release is successfully deleted */
  'action.delete.success': '<strong>{{title}}</strong> release was successfully deleted',
  /** Action message for when document is already in release  */
  'action.discard-version': 'Discard version',
  /** Description for toast when version discarding failed */
  'action.discard-version.failure': 'Failed to discard version',
  /** Description for toast when version deletion is successfully discarded */
  'action.discard-version.success': '<strong>{{title}}</strong> version was successfully discarded',
  /** Action text for editing a release */
  'action.edit': 'Edit release',
  /** Action text for opening a release */
  'action.open': 'Open',
  /** Action text for scheduling a release */
  'action.schedule': 'Schedule for publishing...',
  /** Action text for scheduling a release */
  'action.unschedule': 'Unschedule',
  /** Action text for publishing all documents in a release (and the release itself) */
  'action.publish-all-documents': 'Publish all documents',
  /** Text for the review changes button in release tool */
  'action.review': 'Review changes',
  /** Text for the summary button in release tool */
  'actions.summary': 'Summary',
  /** Label for unarchiving a release */
  'action.unarchive': 'Unarchive release',
  /** Title for the dialog confirming the archive of a release */
  'archive-dialog.confirm-archive-title':
    "Are you sure you want to archive the <strong>'{{title}}'</strong> release?",
  /** Description for the dialog confirming the archive of a release with one document */
  'archive-dialog.confirm-archive-description_one': 'This will archive 1 document version.',
  /** Description for the dialog confirming the publish of a release with more than one document */
  'archive-dialog.confirm-archive-description_other':
    'This will archive {{count}} document versions.',
  /** Label for the button to proceed with archiving a release */
  'archive-dialog.confirm-archive-button': 'Yes, archive now',

  /** Title for changes to published documents */
  'changes-published-docs.title': 'Changes to published documents',
  /** Text for when a release / document was created */
  'created': 'Created <RelativeTime/>',

  /** Text for the releases detail screen when a release was published */
  'dashboard.details.published-on': 'Published on {{date}}',

  /** Text for the releases detail screen in the pin release button. */
  'dashboard.details.pin-release': 'Pin release',

  /** Activity inspector button text */
  'dashboard.details.activity': 'Activity',
  /** Warning for deleting a release that it will delete one document version */
  'delete.warning_one': 'This will also delete one document version.',
  /** Warning for deleting a release that it will delete multiple document version */
  'delete.warning_other': 'This will also delete {{count}} document versions.',
  /** Header for deleting a release dialog */
  'delete-dialog.header': "Are you sure you want to delete the release '{{title}}'?",
  /** Text for when there's no changes in a release diff */
  'diff.no-changes': 'No changes',
  /** Text for when there's no changes in a release diff */
  'diff.list-empty': 'Changes list is empty, see document',
  /** Description for discarding a version of a document dialog */
  'discard-version-dialog.description':
    "The '<strong>{{title}}</strong>' version of this document will be permanently deleted.",
  /** Header for discarding a version of a document dialog */
  'discard-version-dialog.header': 'Are you sure you want to discard the document version?',
  /** Title for dialog for discarding a version of a document */
  'discard-version-dialog.title': 'Discard version',
  /** Label for the count of added documents in to a release */
  'document-count.added': '{{count}} added documents',
  /** Label for the count of added documents in to a release when only 1 document added*/
  'document-count.added-singular': '{{count}} added document',
  /** Label for the count of changed documents in a release */
  'document-count.changed': '{{count}} changed documents',
  /** Label for the count of changed documents in a release when only 1 document changed */
  'document-count.changed-singular': '{{count}} changed document',
  /** Text for when documents of a release are loading */
  'document-loading': 'Loading documents',
  /** Label for when a document in a release has multiple validation warnings */
  'document-validation.error': '{{count}} validation errors',
  /** Label for when a document in a release has a single validation warning */
  'document-validation.error-singular': '{{count}} validation error',

  /** Label when a release has been deleted by a different user */
  'deleted-release': "The '<strong>{{title}}</strong>' release has been deleted",

  /** Title text when error during release update */
  'failed-edit-title': 'Failed to save changes',
  /**The text that will be shown in the footer to indicate the time the release was archived */
  'footer.status.archived': 'Archived',
  /**The text that will be shown in the footer to indicate the time the release was created */
  'footer.status.created': 'Created',
  /**The text that will be shown in the footer to indicate the time the release was created */
  'footer.status.edited': 'Edited',
  /**The text that will be shown in the footer to indicate the time the release was published */
  'footer.status.published': 'Published',

  /** Label text for the loading state whilst release is being loaded */
  'loading-release': 'Loading release',

  /** Label for the release menu */
  'menu.label': 'Release menu',
  /** Tooltip for the release menu */
  'menu.tooltip': 'Actions',

  /** Text for when no archived releases are found */
  'no-archived-release': 'No archived releases',
  /** Text for when no releases are found */
  'no-releases': 'No Releases',
  /** Text for when a release is not found */
  'not-found': 'Release not found: {{releaseId}}',

  /** Description for the release tool */
  'overview.description':
    'Releases are collections of document versions which can be managed and published together.',
  /** Text for the placeholder in the search release input  */
  'overview.search-releases-placeholder': 'Search releases',
  /** Title for the release tool */
  'overview.title': 'Releases',

  /** Title for the dialog confirming the publish of a release */
  'publish-dialog.confirm-publish.title':
    'Are you sure you want to publish the release and all document versions?',
  /** Description for the dialog confirming the publish of a release with one document */
  'publish-dialog.confirm-publish-description_one':
    "The '<strong>{{title}}</strong>' release and its document will be published.",
  /** Description for the dialog confirming the publish of a release with multiple documents */
  'publish-dialog.confirm-publish-description_other':
    "The '<strong>{{title}}</strong>' release and its {{releaseDocumentsLength}} documents will be published.",
  /** Label for when documents are being validated */
  'publish-dialog.validation.loading': 'Validating documents...',
  /** Label for when documents in release have validation errors */
  'publish-dialog.validation.error': 'Some documents have validation errors',

  /** Title o unschedule release dialog */
  'schedule-button.tooltip': 'Are you sure you want to unschedule the release?',

  /** Schedule release button tooltip when validation is loading */
  'schedule-button-tooltip.validation.loading': 'Validating documents...',
  /** Schedule release button tooltip when there are validation errors */
  'schedule-button-tooltip.validation.error': 'Some documents have validation errors',

  /** Schedule release button tooltip when the release is already scheduled */
  'schedule-button-tooltip.already-scheduled': 'This release is already scheduled',

  /** Title for unschedule release dialog */
  'schedule-dialog.confirm-title':
    'Are you sure you want to schedule the release and all document versions for publishing?',
  /** Description shown in unschedule relaease dialog */
  'schedule-dialog.confirm-description_one':
    "The '<strong>{{title}}</strong>' release and its document will be published on the selected date.",
  /** Description for the dialog confirming the publish of a release with multiple documents */
  'schedule-dialog.confirm-description_other':
    'The <strong>{{title}}</strong> release and its {{count}}  document versions will be scheduled for publishing.',

  /** Description for the confirm button for scheduling a release */
  'schedule-dialog.confirm-button': 'Yes, schedule for publishing',

  /** Label for date picker when scheduling a release */
  'schedule-dialog.select-publish-date-label': 'Schedule for publishing on',

  /** Title for unschedule release dialog */
  'unschedule-dialog.confirm-title': 'Are you sure you want to unschedule the release?',
  /** Description shown in unschedule relaease dialog */
  'unschedule-dialog.confirm-description':
    'The release will no longer be published on the scheduled date',

  /** Description for the review changes button in release tool */
  'review.description': 'Add documents to this release to review changes',
  /** Text for when a document is edited */
  'review.edited': 'Edited <RelativeTime/>',

  /** Placeholder for search of documents in a release */
  'search-documents-placeholder': 'Search documents',
  /** Text for when the release was created */
  'summary.created': 'Created <RelativeTime/>',
  /** Text for when the release was published */
  'summary.published': 'Published <RelativeTime/>',
  /** Text for when the release has not published */
  'summary.not-published': 'Not published',
  /** Text for when the release has no documents */
  'summary.no-documents': 'No documents',
  /** Text for when the release is composed of one document */
  'summary.document-count_one': '{{count}} document',
  /** Text for when the release is composed of multiple documents */
  'summary.document-count_other': '{{count}} documents',

  /** add action type that will be shown in the table*/
  'table-body.action.add': 'Add',
  /** Change action type that will be shown in the table*/
  'table-body.action.change': 'Change',

  /** Header for the document table in the release tool - contributors */
  'table-header.contributors': 'Contributors',
  /** Header for the document table in the release tool - type */
  'table-header.type': 'Type',
  /** Header for the document table in the release tool - release title */
  'table-header.title': 'Release',
  /** Header for the document table in the release tool - action */
  'table-header.action': 'Action',
  /** Header for the document table in the release tool - title */
  'table-header.documents': 'Documents',
  /** Header for the document table in the release tool - edited */
  'table-header.edited': 'Edited',
  /** Header for the document table in the release tool - time */
  'table-header.time': 'Time',
  /** Text for toast when release has been archived */
  'toast.archive.success': "The '<strong>{{title}}</strong>' release was archived.",
  /** Text for toast when release failed to archive */
  'toast.archive.error': "Failed to archive '<strong>{{title}}</strong>': {{error}}",
  /** Text for toast when release failed to publish */
  'toast.publish.error': "Failed to publish '<strong>{{title}}</strong>': {{error}}",
  /** Text for toast when release has been published */
  'toast.publish.success': "The '<strong>{{title}}</strong>' release was published.",
  /** Text for toast when release failed to schedule */
  'toast.schedule.error': "Failed to schedule '<strong>{{title}}</strong>': {{error}}",
  /** Text for toast when release has been scheduled */
  'toast.schedule.success': "The '<strong>{{title}}</strong>' release was scheduled.",
  /** Text for toast when release failed to unschedule */
  'toast.unschedule.error': "Failed to unscheduled '<strong>{{title}}</strong>': {{error}}",
  /** Text for toast when release has been unschedule */
  'toast.unschedule.success': "The '<strong>{{title}}</strong>' release was unscheduled.",

  'type-picker.tooltip.scheduled': 'The release is scheduled, unschedule it to change type',
}

/**
 * @alpha
 */
export type ReleasesLocaleResourceKeys = keyof typeof releasesLocaleStrings

export default releasesLocaleStrings
