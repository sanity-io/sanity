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
  /** Action text for reverting a release by creating a new release */
  'action.create-revert-release': 'Stage in new release',
  /** Action text for deleting a release */
  'action.delete-release': 'Delete release',
  /** Action text for editing a release */
  'action.edit': 'Edit release',
  /** Action text for opening a release */
  'action.open': 'Open',
  /** Action text for scheduling a release */
  'action.schedule': 'Schedule for publishing...',
  /** Action text for unpublishing a document in a release in the context menu */
  'action.unpublish': 'Unpublish',
  /** Action message for scheduling an unpublished of a document  */
  'action.unpublish-doc-actions': 'Unpublish when releasing',
  /** Action text for unscheduling a release */
  'action.unschedule': 'Unschedule for publishing',
  /** Action text for publishing all documents in a release (and the release itself) */
  'action.publish-all-documents': 'Publish all documents',
  /** Text for the review changes button in release tool */
  'action.review': 'Review changes',
  /** Action text for reverting a release */
  'action.revert': 'Revert release',
  /** Text for the summary button in release tool */
  'actions.summary': 'Summary',
  /** Action text for reverting a release immediately without staging changes */
  'action.immediate-revert-release': 'Revert now',
  /** Label for unarchiving a release */
  'action.unarchive': 'Unarchive release',
  /* The text for the activity event when a document is added to a release */
  'activity.event.add-document': 'added a document version',
  /* The text for the activity event when the release is archived */
  'activity.event.archive': 'archived the <strong>{{releaseTitle}}</strong> release',
  /* The text for the activity event when the release is created */
  'activity.event.create':
    'created the <strong>{{releaseTitle}}</strong> release <ScheduleTarget>targeting </ScheduleTarget>',
  /* The text for the activity event when a document is removed from a release */
  'activity.event.discard-document': 'discarded a document version',
  'activity.event.edit': 'set release time to <ScheduleTarget></ScheduleTarget>',
  /**The text to display in the changes when the release type changes to asap */
  'activity.event.edit-time-asap': 'immediately',
  /**The text to display in the changes when the release type changes to undecided */
  'activity.event.edit-time-undecided': 'never',
  /* The text for the activity event when the release is published */
  'activity.event.publish': 'published the <strong>{{releaseTitle}}</strong> release',
  /* The text for the activity event when the release is scheduled */
  'activity.event.schedule': 'marked as scheduled',
  /** The text for the activity event when the release is unarchived */
  'activity.event.unarchive': 'unarchived the <strong>{{releaseTitle}}</strong> release',
  /** The text for the activity event when the release is unscheduled */
  'activity.event.unschedule': 'marked as unscheduled',
  /** The loading text for when releases are loading */
  'activity.panel.loading': 'Loading release activity',
  /** The loading text for when releases are loading */
  'activity.panel.error': 'An error occurred getting the release activity',
  /** The title for the activity panel shown in the releases detail screen */
  'activity.panel.title': 'Activity',

  /** Header for the dialog confirming the archive of a release */
  'archive-dialog.confirm-archive-header':
    "Are you sure you want to archive the '{{title}}' release?",
  /** Title for the dialog confirming the archive of a release */
  'archive-dialog.confirm-archive-title':
    "Are you sure you want to archive the <strong>'{{title}}'</strong> release?",
  /** Description for the dialog confirming the archive of a release with no documents */
  'archive-dialog.confirm-archive-description_zero': 'This will not archive any documents.',
  /** Description for the dialog confirming the archive of a release with one document */
  'archive-dialog.confirm-archive-description_one': 'This will archive 1 document version.',
  /** Description for the dialog confirming the archive of a release with more than one document */
  'archive-dialog.confirm-archive-description_other':
    'This will archive {{count}} document versions.',
  /** Label for the button to proceed with archiving a release */
  'archive-dialog.confirm-archive-button': 'Yes, archive now',

  /** Title for changes to published documents */
  'changes-published-docs.title': 'Changes to published documents',
  /** Text for when a release / document was created */
  'created': 'Created <RelativeTime/>',

  /** Text for the releases detail screen when a release was published ASAP */
  'dashboard.details.published-asap': 'Published',
  /** Text for the releases detail screen when a release was published from scheduling */
  'dashboard.details.published-on': 'Published on {{date}}',

  /** Text for the releases detail screen in the pin release button. */
  'dashboard.details.pin-release': 'Pin release',

  /** Activity inspector button text */
  'dashboard.details.activity': 'Activity',

  /** Header for deleting a release dialog */
  'delete-dialog.confirm-delete.header': "Are you sure you want to delete the '{{title}}' release?",
  /** Description for the dialog confirming the deleting of a release with no documents */
  'delete-dialog.confirm-delete-description_zero': 'This will not delete any documents.',
  /** Description for the dialog confirming the deleting of a release with one document */
  'delete-dialog.confirm-delete-description_one': 'This will delete 1 document version.',
  /** Description for the dialog confirming the deleting of a release with more than one document */
  'delete-dialog.confirm-delete-description_other': 'This will delete {{count}} document versions.',
  /** Label for the button to proceed deleting a release */
  'delete-dialog.confirm-delete-button': 'Delete',

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
  /** Label for when a document in a release has multiple validation warnings */
  'document-validation.error_other': '{{count}} validation errors',
  /** Label for when a document in a release has a single validation warning */
  'document-validation.error_one': '{{count}} validation error',

  /** Label when a release has been deleted by a different user */
  'deleted-release': "The '<strong>{{title}}</strong>' release has been deleted",

  /** Title text displayed for technical error details */
  'error-details-title': 'Error details',
  /** Title text when error during release update */
  'failed-edit-title': 'Failed to save changes',
  /** Title text displayed for releases that failed to publish  */
  'failed-publish-title': 'Failed to publish',
  /** Title text displayed for releases that failed to schedule  */
  'failed-schedule-title': 'Failed to schedule',

  /**The text that will be shown in the footer to indicate the time the release was archived */
  'footer.status.archived': 'Archived',
  /**The text that will be shown in the footer to indicate the time the release was created */
  'footer.status.created': 'Created',
  /**The text that will be shown in the footer to indicate the time the release was created */
  'footer.status.edited': 'Edited',
  /**The text that will be shown in the footer to indicate the time the release was published */
  'footer.status.published': 'Published',
  /**The text that will be shown in the footer to indicate the time the release was unarchived */
  'footer.status.unarchived': 'Unarchived',
  /** Label text for the loading state whilst release is being loaded */
  'loading-release': 'Loading release',

  /** Label for the release menu */
  'menu.label': 'Release menu',
  /** Tooltip for the release menu */
  'menu.tooltip': 'Actions',
  /** Label for title of actions for "when releasing" */
  'menu.group.when-releasing': 'When releasing',

  /** Text for when no archived releases are found */
  'no-archived-release': 'No archived releases',
  /** Text for when no releases are found */
  'no-releases': 'No Releases',
  /** Text for when a release is not found */
  'not-found': 'Release not found: {{releaseId}}',

  /** Text for when a release is not found */
  'overview.calendar.tooltip': 'View calendar',
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

  /** Description for the review changes button in release tool */
  'review.description': 'Add documents to this release to review changes',
  /** Text for when a document is edited */
  'review.edited': 'Edited <RelativeTime/>',
  /** Description for the dialog confirming the revert of a release with multiple documents */
  'revert-dialog.confirm-revert-description_one':
    'This will revert {{releaseDocumentsLength}} document version.',
  /** Description for the dialog confirming the revert of a release with multiple documents */
  'revert-dialog.confirm-revert-description_other':
    'This will revert {{releaseDocumentsLength}} document versions.',
  /** Title for the dialog confirming the revert of a release */
  'revert-dialog.confirm-revert.title': "Are you sure you want to revert the '{{title}}' release?",
  /** Checkbox label to confirm whether to create a staged release for revert or immediately revert */
  'revert-dialog.confirm-revert.stage-revert-checkbox-label':
    'Stage revert actions in a new release',
  /** Warning card text for when immediately revert a release with history */
  'revert-dialog.confirm-revert.warning-card':
    'Changes were made to documents in this release after they were published. Reverting will overwrite these changes.',
  /** Title of a reverted release */
  'revert-release.title': 'Reverting "{{title}}"',
  /** Description of a reverted release */
  'revert-release.description': 'Revert changes to document versions in "{{title}}".',

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
    'The <strong>{{title}}</strong> release and its {{count}} document versions will be scheduled for publishing.',

  /** Description for the confirm button for scheduling a release */
  'schedule-dialog.confirm-button': 'Yes, schedule for publishing',

  /** Label for date picker when scheduling a release */
  'schedule-dialog.select-publish-date-label': 'Schedule for publishing on',

  /** Title for unschedule release dialog */
  'unschedule-dialog.confirm-title': 'Are you sure you want to unschedule the release?',
  /** Description shown in unschedule relaease dialog */
  'unschedule-dialog.confirm-description':
    'The release will no longer be published on the scheduled date',
  /** Description for warning that the published schedule time is in the past */
  'schedule-dialog.publish-date-in-past-warning':
    'Schedule this release for a future time and date.',

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
  /** Change action type that will be shown in the table*/
  'table-body.action.unpublish': 'Unpublish',

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
  /** Description for toast when release deletion failed */
  'toast.delete.error': "Failed to delete '<strong>{{title}}</strong>': {{error}}",
  /** Description for toast when release is successfully deleted */
  'toast.delete.success': "The '<strong>{{title}}</strong>' release was successfully deleted",
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
  /** Text for toast when release has been unarchived */
  'toast.unarchive.success': "The '<strong>{{title}}</strong>' release was unarchived.",
  /** Text for toast when release failed to unarchive */
  'toast.unarchive.error': "Failed to unarchive '<strong>{{title}}</strong>': {{error}}",
  /** Description for toast when release deletion failed */
  /** Text for tooltip when a release has been scheduled */
  'type-picker.tooltip.scheduled': 'The release is scheduled, unschedule it to change type',
  /** Text for toast when release failed to revert */
  'toast.revert.error': 'Failed to revert release: {{error}}',
  /** Text for toast when release has been reverted immediately */
  'toast.immediate-revert.success': "The '{{title}}' release was successfully reverted",
  /** Text for toast when release has reverted release successfully staged */
  'toast.revert-stage.success': "Revert release for '{{title}}' was successfully created. <Link/>",
  /** Link text for toast link to the generated revert release */
  'toast.revert-stage.success-link': 'View revert release',

  /** Title for the dialog confirming the unpublish of a release */
  'unpublish-dialog.header': 'Are you sure you want to unpublish this document when releasing?',
  /** Text action in unpublish dialog to cancel */
  'unpublish-dialog.action.cancel': 'Cancel',
  /** Text action in unpublish dialog to unpublish */
  'unpublish-dialog.action.unpublish': 'Yes, unpublish when releasing',
  /** Description for the unpublish dialog, explaining that it will create a draft if no draft exists at time of release */
  'unpublish-dialog.description.to-draft':
    'This will unpublish the document as part of the <Label>{{title}}</Label> release, and create a draft if no draft exists at the time of release.',
  /** Description for unpublish dialog, explaining that all changes made to this document will be lost */
  'unpublish-dialog.description.lost-changes':
    'Any changes made to this document version will be lost.',
}

/**
 * @alpha
 */
export type ReleasesLocaleResourceKeys = keyof typeof releasesLocaleStrings

export default releasesLocaleStrings
