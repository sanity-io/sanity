/* eslint sort-keys: "error" */
import {defineLocalesResources} from 'sanity'

/**
 * Defined locale strings for the vision tool, in US English.
 *
 * @internal
 */
const visionLocaleStrings = defineLocalesResources('vision', {
  /** Label for action "Copy to clipboard", tied to the "Query URL" field. Also used for accessibility purposes on button */
  'action.copy-url-to-clipboard': 'Copy to clipboard',
  /** Label for deleting a query */
  'action.delete': 'Delete',
  /** Label for editing a query's title */
  'action.edit-title': 'Edit title',
  /** Label for stopping an ongoing listen operation */
  'action.listen-cancel': 'Stop',
  /** Label for setting up a listener */
  'action.listen-execute': 'Listen',
  /** Label for query loading table */
  'action.load-queries': 'Load queries',
  /** Label for loading a query */
  'action.load-query': 'Load query',
  /** Label for cancelling an ongoing query */
  'action.query-cancel': 'Cancel',
  /** Label for executing the query, eg doing a fetch */
  'action.query-execute': 'Fetch',
  /** Label for saving a query */
  'action.save-query': 'Save query',
  /** Label for updating a query */
  'action.update': 'Update',

  /** Label for actions user can take */
  'label.actions': 'Actions',
  /** Label for saved queries that have been edited */
  'label.edited': 'Edited',

  /**
   * Some features has a "New" label indicating that the feature was recently introduced.
   * This defines what the text of that label is. Keep it short and sweet.
   */
  'label.new': 'New',
  /** Label for query type "personal" */
  'label.personal': 'Personal',
  /** Label for savedAt date */
  'label.saved-at': 'Saved at',
  /** Saved queries */
  'label.saved-queries': 'Saved queries',
  /** Search queries */
  'label.search-queries': 'Search queries',
  /** Share query */
  'label.share': 'Share',
  /** Label for saved query type "team" */
  'label.team': 'Team',

  /** Error message for when the "Params" input are not a valid json */
  'params.error.params-invalid-json': 'Parameters are not valid JSON',
  /** Label for "Params" (parameters) editor/input */
  'params.label': 'Params',

  /** Label for 'Column' indicator when there is an error within the query */
  'query.error.column': 'Column',
  /** Label for 'Line' indicator when there is an error within the query */
  'query.error.line': 'Line',
  /** Label for "Query" editor/input */
  'query.label': 'Query',
  /** Label for the "Query URL" field, shown after executing a query, and allows for copying */
  'query.url': 'Query URL',

  /** Label for "End to End time" information of the fetched query */
  'result.end-to-end-time-label': 'End-to-end',
  /** Label for "Execution time" information of the fetched query */
  'result.execution-time-label': 'Execution',
  /** Label for "Result" explorer/view */
  'result.label': 'Result',
  /** Tooltip text shown when the query result is not encodable as CSV */
  'result.save-result-as-csv.not-csv-encodable': 'Result cannot be encoded as CSV',
  /** Label for "Save result as" result action */
  'result.save-result-as-format': 'Save result as <SaveResultButtons/>',
  /**
   * "Not applicable" message for when there is no Execution time or End to End time information
   * available for the query (eg when the query has not been executed, or errored)
   */
  'result.timing-not-applicable': 'n/a',

  /** Query already saved error label */
  'save-query.already-saved': 'Query already saved',
  /** Save error label */
  'save-query.error': 'Error saving query',
  /** Save success label */
  'save-query.success': 'Query saved',

  /** Label for the "API version" dropdown in settings */
  'settings.api-version-label': 'API version',
  /** Label for the "Custom API version" input in settings, shown when "other" is chosen as API version */
  'settings.custom-api-version-label': 'Custom API version',
  /** Label for the "Dataset" dropdown in vision settings */
  'settings.dataset-label': 'Dataset',
  /** Error label for when the API version in 'Custom API version' input is invalid */
  'settings.error.invalid-api-version': 'Invalid API version',
  /** Label for the "other" versions within the "API version" dropdown */
  'settings.other-api-version-label': 'Other',
  /**
   * Label for the "Perspective" dropdown in vision settings
   * @see {@link https://www.sanity.io/docs/perspectives}
   */
  'settings.perspective-label': 'Perspective',
  /** Notification about previewDrafts to drafts rename */
  'settings.perspective.preview-drafts-renamed-to-drafts.description':
    'The "<code>previewDrafts</code>" perspective has been renamed to "<code>drafts</code>" and is now deprecated. This change is effective for all versions with perspective support (>= v2021-03-25).',
  /** Call to action to read the docs related to "Perspectives" */
  'settings.perspectives.action.docs-link': 'Read docs',
  /** Option for selecting default perspective */
  'settings.perspectives.default': 'No perspective (API default)',
  /** Description for popover that explains what "Perspectives" are */
  'settings.perspectives.description':
    'Perspectives allow your query to run against different "views" of the content in your dataset',
  /** Description for upcoming default perspective change */
  'settings.perspectives.new-default.description':
    'The default perspective will change from "<code>raw</code>" to "<code>published</code>" in an upcoming API version. Please consult docs for more details.',
  /** Label for the pinned release perspective */
  'settings.perspectives.pinned-release-label': 'Pinned release',
  /** Title for popover that explains what "Perspectives" are */
  'settings.perspectives.title': 'Perspectives',
} as const)

/**
 * @alpha
 */
export type VisionLocaleResourceKeys = keyof typeof visionLocaleStrings

export default visionLocaleStrings
