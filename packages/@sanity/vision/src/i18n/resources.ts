/**
 * Defined locale strings for the vision tool, in US English.
 *
 * @internal
 */
const visionLocaleStrings = {
  /**
   * Context: "Vision" is a Sanity studio plugin which allows users to execute GROQ-queries
   * against their dataset and see the results in different ways. It is often used to explore
   * a dataset, debug queries and get a better understanding of the data.
   */

  /**
   * Some features has a "New" label indicating that the feature was recently introduced.
   * This defines what the text of that label is. Keep it short and sweet.
   */
  'label.new': 'New',

  /** --- Settings --- */

  /** Label for the "Dataset" dropdown in vision settings */
  'settings.dataset-label': 'Dataset',

  /** Label for the "API version" dropdown in settings */
  'settings.api-version-label': 'API version',

  /** Label for the "other" versions within the "API version" dropdown */
  'settings.other-api-version-label': 'Other',

  /** Label for the "Custom API version" input in settings, shown when "other" is chosen as API version */
  'settings.custom-api-version-label': 'Custom API version',

  /** Error label for when the API version in 'Custom API version' input is invalid */
  'settings.error.invalid-api-version': 'Invalid API version',

  /**
   * Label for the "Perspective" dropdown in vision settings
   * @see {@link https://www.sanity.io/docs/perspectives}
   */
  'settings.perspective-label': 'Perspective',

  /** Title for popover that explains what "Perspectives" are */
  'settings.perspectives.title': 'Perspectives',

  /** Description for popover that explains what "Perspectives" are */
  'settings.perspectives.description':
    'Perspectives allow your query to run against different "views" of the content in your dataset',

  /** Call to action to read the docs related to "Perspectives" */
  'settings.perspectives.action.docs-link': 'Read docs',

  /** --- Query editor --- */

  /** Label for "Query" editor/input */
  'query.label': 'Query',

  /** Label for 'Line' indicator when there is an error within the query */
  'query.error.line': 'Line',

  /** Label for 'Column' indicator when there is an error within the query */
  'query.error.column': 'Column',

  /** Label for the "Query URL" field, shown after executing a query, and allows for copying */
  'query.url': 'Query URL',

  /** --- Params editor --- */

  /** Label for "Params" (parameters) editor/input */
  'params.label': 'Params',

  /** Error message for when the "Params" input are not a valid json */
  'params.error.params-invalid-json': 'Parameters are not valid JSON',

  /** --- Results view/explorer --- */

  /** Label for "Result" explorer/view */
  'result.label': 'Result',

  /** Label for "Execution time" information of the fetched query */
  'result.execution-time-label': 'Execution',

  /** Label for "End to End time" information of the fetched query */
  'result.end-to-end-time-label': 'End-to-end',

  /** "Not applicable" message for when there is no Execution time or End to End time information
   * available for the query (eg when the query has not been executed, or errored) */
  'result.timing-not-applicable': 'n/a',

  /** --- Actions -- */

  /** Label for executing the query, eg doing a fetch */
  'action.query-execute': 'Fetch',

  /** Label for cancelling an ongoing query */
  'action.query-cancel': 'Cancel',

  /** Label for setting up a listener */
  'action.listen-execute': 'Listen',

  /** Label for stopping an ongoing listen operation */
  'action.listen-cancel': 'Stop',

  /** Label for action "Copy to clipboard", tied to the "Query URL" field. Also used for accessibility purposes on button */
  'action.copy-url-to-clipboard': 'Copy to clipboard',
}

export default visionLocaleStrings
