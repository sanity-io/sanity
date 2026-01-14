/**
 * Defined locale strings for the single doc release tool, in US English.
 *
 * @internal
 */
const singleDocReleaseLocaleStrings = {
  /** Action text for scheduling publish of a draft document */
  'action.schedule-publish': 'Schedule publish',
  /** Tooltip text for when a document is scheduled for publishing */
  'action.schedule-publish-success': 'Document scheduled for publishing',
  /** Tooltip description for when a document is scheduled for publishing */
  'action.schedule-publish-success-description': 'Publishing scheduled for {{publishAt}}',

  /** Tooltip text for when schedule publish fails */
  'action.schedule-publish-error': 'Failed to schedule publishing',

  /** Tooltip text for when schedule publish is disabled due to validation errors */
  'action.schedule-publish.disabled.validation-issues':
    'Cannot Schedule Draft due to validation errors in the current draft.',

  /** Tooltip text for when schedule publish is disabled due to cardinality one releases */
  'action.schedule-publish.disabled.cardinality-one':
    'A Scheduled Draft for this document already exists.',
  /** Empty state title for scheduled drafts */
  'empty-state.title': 'Scheduled Drafts',
  /** Empty state description for scheduled drafts */
  'empty-state.description':
    'Schedule and lock draft documents for publishing at a future date and time.',
  /** Empty state action documentation for scheduled drafts */
  'empty-state.action.documentation': 'Learn about scheduling',
}

/**
 * @alpha
 */
export type SingleDocReleaseLocaleResourceKeys = keyof typeof singleDocReleaseLocaleStrings

export default singleDocReleaseLocaleStrings
