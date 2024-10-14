/**
 * Defined locale strings for the releases tool, in US English.
 *
 * @internal
 */
const releasesLocaleStrings = {
  /** Action text for archiving a release */
  'action.archive': 'Archive',
  /** Action text for showing the archived releases */
  'action.archived': 'Archived',
  /** Action text for deleting a release */
  'action.delete': 'Delete',
  /** Description for toast when release deletion failed */
  'action.delete.failure': 'Failed to delete release',
  /** Description for toast when release is successfully deleted */
  'action.delete.success': '<strong>{{title}}</strong> release was successfully deleted',
  /** Action text for editing a release */
  'action.edit': 'Edit',
  /** Action text for opening a release */
  'action.open': 'Open',
  /** Action text for publishing a release */
  'action.publish': 'Publish',
  /** Action text for publishing all documents in a release (and the release itself) */
  'action.publish-all': 'Publish all',
  /** Text for the review changes button in release tool */
  'action.review': 'Review changes',
  /** Text for the summary button in release tool */
  'actions.summary': 'Summary',
  /** Label for unarchiving a release */
  'action.unarchive': 'Unarchive',

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
  /** Text for when documents of a release are loading */
  'document-loading': 'Loading documents',
  /** Label for when documents in release have validation warnings */
  'document-validation.error': 'There are validation errors in this document',
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
    "The '<strong>{{title}}</strong>' release and its {{bundleDocumentsLength}} documents will be published.",
  /** Label for when documents are being validated */
  'publish-dialog.validation.loading': 'Validating documents...',
  /** Label for when documents in release have validation errors */
  'publish-dialog.validation.error': 'Some documents have validation errors',

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
  /** Header for the document table in the release tool - created */
  'table-header.created': 'Created',
  /** Header for the document table in the release tool - type */
  'table-header.type': 'Type',
  /** Header for the document table in the release tool - action */
  'table-header.action': 'Action',
  /** Header for the document table in the release tool - title */
  'table-header.documents': 'Documents',
  /** Header for the document table in the release tool - edited */
  'table-header.edited': 'Edited',
  /** Header for the document table in the release tool - published */
  'table-header.published': 'Published',
  /** Text for toast when release failed to publish */
  'toast.error': "Failed to publish the '<strong>{{title}}</strong>'",
  /** Text for toast when release has been published */
  'toast.published': "The '<strong>{{title}}</strong>' release was published.",
}

/**
 * @alpha
 */
export type ReleasesLocaleResourceKeys = keyof typeof releasesLocaleStrings

export default releasesLocaleStrings
