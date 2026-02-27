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
  /** Action text for showing the paused scheduled drafts */
  'action.paused': 'Paused',
  /** Action text for staging a new revert release */
  'action.create-revert-release': 'Create a new release',
  /** Action text for deleting a release */
  'action.delete-release': 'Delete release',
  /** Menu item label for showing scheduled drafts */
  'action.drafts': 'Scheduled drafts',
  /** Action text for duplicating a release */
  'action.duplicate-release': 'Duplicate release',
  /** Action text for editing a release */
  'action.edit': 'Edit release',
  /** Action text for opening a release */
  'action.open': 'Active',
  /** Menu item label for showing releases (multi-document releases) */
  'action.releases': 'Releases',
  /** Action text for scheduling a release */
  'action.schedule': 'Schedule release...',
  /** Action text for scheduling unpublish of a draft document */
  'action.schedule-unpublish': 'Schedule Unpublish',
  /** Tooltip text for when schedule unpublish is disabled because document is not published */
  'action.schedule-unpublish.disabled.not-published':
    'Document must be published to schedule unpublish',
  /** Action text for unpublishing a document in a release in the context menu */
  'action.unpublish': 'Unpublish',
  /** Action message for scheduling an unpublished of a document  */
  'action.unpublish-doc-actions': 'Unpublish when releasing',
  /** Action message for when document is scheduled for unpublishing a document and you want to no longer unpublish it */
  'action.revert-unpublish-actions': 'Revert unpublish when releasing',
  /** Action text for unscheduling a release */
  'action.unschedule': 'Unschedule release',
  /** Action text for publishing all documents in a release (and the release itself) */
  'action.publish-all-documents': 'Run release',
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
  'archive-dialog.confirm-archive-header': 'Are you sure you want to archive this release?',
  /** Title for the dialog confirming the archive of a release */
  'archive-dialog.confirm-archive-title':
    "Are you sure you want to archive the <strong>'{{title}}'</strong> release?",
  /** Description for the dialog confirming the archive of a release with one document */
  'archive-dialog.confirm-archive-description_one': 'This will archive 1 document version.',
  /** Description for the dialog confirming the archive of a release with more than one document */
  'archive-dialog.confirm-archive-description_other':
    'This will archive {{count}} document versions.',
  /** Label for the button to proceed with archiving a release */
  'archive-dialog.confirm-archive-button': 'Yes, archive release',

  /** Title for information card on a archived release */
  'archive-info.title': 'This release is archived',
  /** Description for information card on a published or archived release to description retention effects */
  'archive-info.description':
    'It will be available for {{retentionDays}} days, then automatically removed on {{removalDate}}. <Link>Learn about retention</Link>.',

  /** Title for changes to published documents */
  'changes-published-docs.title': 'Changes to published documents',
  /** Text for when a release / document was created */
  'created': 'Created <RelativeTime/>',
  /** Suffix for when a release is a copy of another release */
  'copy-suffix': 'Copy',

  /** Text for the releases detail screen when a release was published ASAP */
  'dashboard.details.published-asap': 'Published',
  /** Text for the releases detail screen when a release was published from scheduling */
  'dashboard.details.published-on': 'Published on {{date}}',

  /** Text for the releases detail screen in the pin release button. */
  'dashboard.details.pin-release': 'Pin release to studio',
  /** Text for the releases detail screen in the unpin release button. */
  'dashboard.details.unpin-release': 'Unpin release from studio',

  /** Activity inspector button text */
  'dashboard.details.activity': 'Activity',

  /** Header for deleting a release dialog */
  'delete-dialog.confirm-delete.header': 'Are you sure you want to delete this release?',
  /** Description for the dialog confirming the deleting of a release with one document */
  'delete-dialog.confirm-delete-description_one': 'This will delete 1 document version.',
  /** Description for the dialog confirming the deleting of a release with more than one document */
  'delete-dialog.confirm-delete-description_other': 'This will delete {{count}} document versions.',
  /** Label for the button to proceed deleting a release */
  'delete-dialog.confirm-delete-button': 'Yes, delete release',

  /** Text for when there's no changes in a release diff */
  'diff.no-changes': 'No changes',
  /** Text for when there's no changes in a release diff */
  'diff.list-empty': 'Changes list is empty, see document',
  /** Description for discarding a draft of a document dialog */
  'discard-version-dialog.description-draft':
    'This will permanently remove all changes made to this document. This action cannot be undone.',
  /** Description for discarding a version of a document dialog */
  'discard-version-dialog.description-release':
    "This will permanently remove all changes made to this document within the '<strong>{{releaseTitle}}</strong>' release. This action cannot be undone.",
  /** Title for dialog for discarding a draft of a document */
  'discard-version-dialog.header-draft': 'Discard draft?',
  /** Header for discarding a version from a release of a document dialog */
  'discard-version-dialog.header-release':
    "Remove document from the '<strong>{{releaseTitle}}</strong>' release?",

  /** Title for dialog for discarding a draft of a document */
  'discard-version-dialog.title-draft': 'Discard draft',
  /** Title for dialog for discarding a version of a document */
  'discard-version-dialog.title-release': 'Remove from release',

  /** Title for dialog when copying version to draft that already exists */
  'copy-to-draft-dialog.title': 'Draft version already exists',
  /** Description for dialog when copying version to draft that already exists */
  'copy-to-draft-dialog.description':
    'A draft version of this document already exists. Copy the current version to the draft and override the existing draft version.',
  /** Confirm button text for overriding existing draft */
  'copy-to-draft-dialog.confirm-button': 'Yes, override Draft',

  /** Label for when a document in a release has multiple validation warnings */
  'document-validation.error_other': '{{count}} validation errors',
  /** Label for when a document in a release has a single validation warning */
  'document-validation.error_one': '{{count}} validation error',

  /** Label when a release has been deleted by a different user */
  'deleted-release': "The '<strong>{{title}}</strong>' release has been deleted",

  /** Header for the dialog confirming the duplicate of a release */
  'duplicate-dialog.confirm-duplicate-header': 'Are you sure you want to duplicate this release?',
  /** Description for the dialog confirming the duplicate of a release with one document */
  'duplicate-dialog.confirm-duplicate-description_one':
    'This will duplicate the release and the 1 document version.',
  /** Description for the dialog confirming the duplicate of a release with more than one document */
  'duplicate-dialog.confirm-duplicate-description_other':
    'This will duplicate the release and the {{count}} document versions.',
  /** Label for the button to proceed with duplicating a release */
  'duplicate-dialog.confirm-duplicate-button': 'Yes, duplicate release',

  /** Title text displayed for technical error details */
  'error-details-title': 'Error details',
  /** Title text when error during release update */
  'failed-edit-title': 'Failed to save changes',
  /** Title text displayed for releases that failed to publish  */
  'failed-publish-title': 'Failed to publish',
  /** Title text displayed for releases that failed to schedule  */
  'failed-schedule-title': 'Failed to schedule',
  /** Tooltip text for releases that have passed their intended publish date */
  'passed-intended-publish-date': 'This release has passed its intended publish date',
  /** Tooltip text for scheduled drafts that have passed their intended publish date */
  'passed-intended-publish-date-draft': 'This draft has passed its intended publish date',

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

  /** Text for when documents of a release are loading */
  'loading-release-documents': 'Loading documents',
  /** Title text for when loading documents on a release failed */
  'loading-release-documents.error.title': 'Something went wrong',
  /** Description text for when loading documents on a release failed */
  'loading-release-documents.error.description':
    "We're unable to load the documents for this release. Please try again later.",

  /** Label for the release menu */
  'menu.label': 'Release menu',
  /** Tooltip for the release menu */
  'menu.tooltip': 'Actions',
  /** Label for title of actions for "when releasing" */
  'menu.group.when-releasing': 'When releasing',

  /** Text for when no archived releases are found */
  'no-archived-release': 'No archived releases',
  /** Tooltip text when there are no paused scheduled drafts */
  'no-paused-release': 'No paused scheduled drafts',
  /** Text for when no releases are found */
  'no-releases': 'No Releases',
  /** Banner text shown when navigating to a release that does not exist */
  'banner.release-not-found': 'This release could not be found',
  /** Tooltip for the dismiss button in the release not found banner */
  'banner.release-not-found.dismiss': 'Dismiss',

  /** Text for the button name for the release tool */
  'overview.action.documentation': 'Documentation',
  /** Tooltip for the calendar button in the release overview */
  'overview.calendar.tooltip': 'View calendar',
  /** Description for the release tool */
  'overview.description':
    'Releases are collections of document changes which can be managed, scheduled, and rolled back together.',
  /** Text for the placeholder in the search release input  */
  'overview.search-releases-placeholder': 'Search releases',
  /** Title for the release tool */
  'overview.title': 'Releases',

  /** Tooltip label when the user doesn't have permission for discarding a version */
  'permissions.error.discard-version': 'You do not have permission to discard this version',
  /** Tooltip label when the user doesn't have permission for unpublishing a document */
  'permissions.error.unpublish': 'You do not have permission to unpublish this document',
  /** Text for when a user doesn't have publish or schedule releases */
  'permission-missing-title': 'Limited access',
  /** Description for when a user doesn't have publish or schedule releases */
  'permission-missing-description':
    'Your role currently limits what you can see in this release. You may not publish nor schedule this release.',
  /** Tooltip label when the user doesn't have permission to archive release */
  'permissions.error.archive': 'You do not have permission to archive this release',
  /** Tooltip label when the user doesn't have permission to delete release */
  'permissions.error.delete': 'You do not have permission to delete this release',
  /** Tooltip label when the user doesn't have permission to duplicate release */
  'permissions.error.duplicate': 'You do not have permission to duplicate this release',
  /** Tooltip label when the user doesn't have permission to unarchive release */
  'permissions.error.unarchive': 'You do not have permission to unarchive this release',

  /** Tooltip text for when one user is editing a document in a release */
  'presence.tooltip.one':
    '{{displayName}} is editing this document in the "{{releaseTitle}}" release right now',
  /** Tooltip text for when multiple users are editing a document in a release */
  'presence.tooltip.other': '{{count}} people are editing this document right now',

  /** Tooltip text for publish release action when there are no documents */
  'publish-action.validation.no-documents': 'There are no documents to publish',
  /** Title for the dialog confirming the publish of a release */
  'publish-dialog.confirm-publish.title':
    'Are you sure you want to publish the release and all document versions?',
  /** Description for the dialog confirming the publish of a release with one document */
  'publish-dialog.confirm-publish-description_one':
    "The '<strong>{{title}}</strong>' release and its document will be published.",
  /** Description for the dialog confirming the publish of a release with multiple documents */
  'publish-dialog.confirm-publish-description_other':
    "The '<strong>{{title}}</strong>' release and its {{releaseDocumentsLength}} documents will be published.",
  /** Label for the button when the user doesn't have permissions to publish a release */
  'publish-dialog.validation.no-permission': 'You do not have permission to publish',
  /** Label for when documents are being validated */
  'publish-dialog.validation.loading': 'Validating documents...',
  /** Label for when documents in release have validation errors */
  'publish-dialog.validation.error': 'Some documents have validation errors',

  /** Title for information card on a published release */
  'publish-info.title': 'This release is published successfully.',

  /** Placeholder title for a release with no title */
  'release-placeholder.title': 'Untitled',

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
  'revert-dialog.confirm-revert.stage-revert-checkbox-label': 'Immediately revert the release',
  /** Warning card text for when immediately revert a release with history */
  'revert-dialog.confirm-revert.warning-card':
    'Changes were made to documents in this release after they were published. Reverting will overwrite these changes.',
  /** Title of a reverted release */
  'revert-release.title': 'Reverting "{{title}}"',
  /** Description of a reverted release */
  'revert-release.description': 'Revert changes to document versions in "{{title}}".',

  /** Title of unschedule release dialog */
  'schedule-button.tooltip': 'Are you sure you want to unschedule the release?',

  /** Schedule release button tooltip when there are no documents to schedule */
  'schedule-action.validation.no-documents': 'There are no documents to schedule',
  /** Schedule release button tooltip when user has no permissions to schedule */
  'schedule-button-tooltip.validation.no-permission': 'You do not have permission to schedule',
  /** Schedule release button tooltip when validation is loading */
  'schedule-button-tooltip.validation.loading': 'Validating documents...',
  /** Schedule release button tooltip when there are validation errors */
  'schedule-button-tooltip.validation.error': 'Some documents have validation errors',

  /** Schedule release button tooltip when the release is already scheduled */
  'schedule-button-tooltip.already-scheduled': 'This release is already scheduled',

  /** Title for unschedule release dialog */
  'schedule-dialog.confirm-title': 'Schedule the release',
  /** Description shown in unschedule relaease dialog */
  'schedule-dialog.confirm-description_one':
    "The '<strong>{{title}}</strong>' release and its document will be published on the selected date.",
  /** Description for the dialog confirming the publish of a release with multiple documents */
  'schedule-dialog.confirm-description_other':
    'The <strong>{{title}}</strong> release and its {{count}} document versions will be scheduled.',

  /** Description for the confirm button for scheduling a release */
  'schedule-dialog.confirm-button': 'Yes, schedule',

  /** Label for date picker when scheduling a release */
  'schedule-dialog.select-publish-date-label': 'Schedule on',

  /** Title for unschedule release dialog */
  'unschedule-dialog.confirm-title': 'Are you sure you want to unschedule the release?',
  /** Description shown in unschedule relaease dialog */
  'unschedule-dialog.confirm-description':
    'The release will no longer be published on the scheduled date',
  /** Description for warning that the published schedule time is in the past */
  'schedule-dialog.publish-date-in-past-warning': 'Schedule for a future time and date.',

  /** Header for the schedule unpublish dialog */
  'schedule-unpublish-dialog.header': 'Schedule draft for Unpublish',
  /** Description for the schedule unpublish dialog */
  'schedule-unpublish-dialog.description': 'Select when this document should be unpublished.',
  /** Confirm button text for the schedule unpublish dialog */
  'schedule-unpublish-dialog.confirm': 'Schedule Unpublish',

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

  /** Text for validation loading indicator */
  'summary.validating-documents': 'Validating documents: {{validatedCount}} of {{totalCount}}',

  /** Text for when the release has validated documents */
  'summary.validated-documents': '{{validatedCount}} of {{totalCount}} documents validated',

  /** Text for when the release has validated all documents */
  'summary.all-documents-validated': 'All documents validated, no conflicts found',

  /** Text for when the release has no errors found */
  'summary.all-documents-errors-found': 'All documents validated, conflicts found',

  /** Text for when the release has some errors found */
  'summary.errors-found':
    'In order to publish or schedule the release, please resolve the conflicts found in the documents',

  /** add action type that will be shown in the table*/
  'table-body.action.add': 'Add',
  /** Change action type that will be shown in the table*/
  'table-body.action.change': 'Change',
  /** Change action type that will be shown in the table*/
  'table-body.action.unpublish': 'Unpublish',

  /** Header for the document table in the release tool - Archived */
  'table-header.archivedAt': 'Archived',
  /** Header for the document table in the release tool - contributors */
  'table-header.contributors': 'Contributors',
  /** Header for the document table in the release tool - created by */
  'table-header.created-by': 'Created by',
  /** Header for the document table in the release tool - document preview */
  'table-header.document': 'Document',
  /** Header for the document table in the release tool - title */
  'table-header.documents': 'Documents',
  /** Header for the document table in the release tool - edited */
  'table-header.edited': 'Edited',
  /** Header for the document table in the release tool - Published */
  'table-header.published-at': 'Published',
  /** Header for the document table in the release tool - Published */
  'table-header.publishedAt': 'Published',
  /** Header for the scheduled drafts document table in the release tool - published at */
  'table-header.scheduled-draft.published-at': 'Published at',
  /** Header for the scheduled drafts document table in the release tool - scheduled for */
  'table-header.scheduled-for': 'Scheduled for',
  /** Header for the paused scheduled drafts table - intended for */
  'table-header.intended-for': 'Intended for',
  /** Header for the document table in the release tool - time */
  'table-header.time': 'Time',
  /** Header for the document table in the release tool - when */
  'table-header.when': 'When',
  /** Header for the  document table in the release tool - release title */
  'table-header.title': 'Release',
  /** Header for the document table in the release tool - type */
  'table-header.type': 'Type',
  /** Header for the document table in the release tool - action */
  'table-header.action': 'Action',

  /** Filter tab label for all documents */
  'filter-tab.all': 'All',
  /** Filter tab label for documents with validation errors */
  'filter-tab.errors': 'Errors',
  /** Text for the release time label for scheduled releases  which has been scheduled*/
  'time.scheduled': 'Scheduled',
  /** Text for the release time label for scheduled releases  which has not been scheduled yet*/
  'time.estimated': 'Estimated',
  /** Text for toast when release failed to archive */
  'toast.archive.error': "Failed to archive '<strong>{{title}}</strong>': {{error}}",
  /** Description for toast when creating new version of document in release failed */
  'toast.create-version.error': 'Failed to add document to release: {{error}}',
  /** Description for toast when release deletion failed */
  'toast.delete.error': "Failed to delete '<strong>{{title}}</strong>': {{error}}",
  /** Description for toast when release is successfully deleted */
  'toast.delete.success': "The '<strong>{{title}}</strong>' release was successfully deleted",
  /** Description for toast when release duplication failed */
  'toast.duplicate.error': "Failed to duplicate '<strong>{{title}}</strong>': {{error}}",
  /** Description for toast when release is successfully duplicated */
  'toast.duplicate.success': "The '<strong>{{title}}</strong>' release was duplicated. <Link/>",
  /** Link text for toast link to the duplicated release */
  'toast.duplicate.success-link': 'View duplicated release',
  /** Text for toast when release failed to publish */
  'toast.publish.error': "Failed to publish '<strong>{{title}}</strong>': {{error}}",
  /** Text for toast when release failed to schedule */
  'toast.schedule.error': "Failed to schedule '<strong>{{title}}</strong>': {{error}}",
  /** Text for toast when release has been scheduled */
  'toast.schedule.success': "The '<strong>{{title}}</strong>' release was scheduled.",
  /** Text for toast when release failed to unschedule */
  'toast.unschedule.error': "Failed to unscheduled '<strong>{{title}}</strong>': {{error}}",
  /** Text for toast when release failed to unarchive */
  'toast.unarchive.error': "Failed to unarchive '<strong>{{title}}</strong>': {{error}}",
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

  /** Text for when a document is unpublished */
  'unpublish.already-unpublished': 'This document is already unpublished.',
  /** Tooltip label for when a document is unpublished */
  'unpublish.no-published-version': 'There is no published version of this document.',
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

  /** Banner text shown when scheduled drafts feature is disabled but there are still scheduled drafts */
  'banner.scheduled-drafts-disabled':
    'Scheduled drafts has been disabled but there are still scheduled drafts to be published.',
  /** Banner text shown when drafts mode is disabled but there are still scheduled drafts */
  'banner.drafts-mode-disabled':
    'Drafts mode has been disabled but there are still scheduled drafts to be published.',
  /** Text for when no scheduled drafts are found */
  'no-scheduled-drafts': 'No Scheduled Drafts',

  /** Banner text showing count of active scheduled drafts requiring confirmation with one draft */
  'banner.confirm-active-scheduled-drafts_one':
    'There is {{count}} Scheduled Draft that requires scheduling confirmation',
  /** Banner text showing count of active scheduled drafts requiring confirmation with multiple drafts */
  'banner.confirm-active-scheduled-drafts_other':
    'There are {{count}} Scheduled Drafts that require scheduling confirmation',
  /** Button text for confirming scheduling of active drafts */
  'banner.confirm-active-scheduled-drafts.button': 'Resume scheduling',
  /** Button text when confirming schedules from paused mode */
  'banner.confirm-active-scheduled-drafts.button-paused': 'Resume all schedules',

  /** Dialog title for confirming active scheduled drafts */
  'confirm-active-scheduled-drafts-dialog.title': 'Resume Scheduled Drafts',
  /** Dialog description for confirming active scheduled drafts */
  'confirm-active-scheduled-drafts-dialog.description':
    'Schedule all paused Scheduled Drafts for their intended publish dates',
  /** Dialog warning when some scheduled drafts have past dates */
  'confirm-active-scheduled-drafts-dialog.past-dates-warning':
    'Some of these Scheduled Drafts are scheduled for past dates. Confirming schedules will immediately publish those versions of documents.',
  /** Dialog confirm button text for confirming all scheduled drafts */
  'confirm-active-scheduled-drafts-dialog.confirm-button': 'Confirm Schedules',

  /** Toast error message when bulk scheduling of active drafts fails */
  'toast.confirm-active-scheduled-drafts.error': 'Failed to schedule drafts: {{error}}',
}

/**
 * @alpha
 */
export type ReleasesLocaleResourceKeys = keyof typeof releasesLocaleStrings

export default releasesLocaleStrings
