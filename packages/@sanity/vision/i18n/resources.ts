/**
 * Defined locale strings for the vision tool, in US English.
 *
 * @internal
 */
const visionLocaleStrings = {
  /** --- Header --- */

  /** Label for the "Dataset" dropdown in vision dropdown */
  'header.dataset-label': 'Dataset',

  /** Label for the "API version" dropdown in vision nav */
  'header.api-version-label': 'API version',

  /** Label for the "other" versions within the "API version" dropdown */
  'header.other-api-version-label': 'other',

  /** Label for the "Custom API version" input in vision nav */
  'header.custom-api-version-label': 'Custom API version',

  /** Error label for when the api version in 'Custom API version' input is invalid */
  'header.error.invalid-api-version': 'Invalid API version',

  /** Label for the "Perspective" dropdown in vision nav */
  'header.perspective-label': 'Perspective',

  /** Label for the "Query URL" input in vision nav */
  'header.query-url': 'Query URL',

  /** Label for action "Copy to clipboard" for the "Query URL" input. Also used for accessibility purposes on button */
  'header.action.copy-to-clipboard': 'Copy to clipboard',

  /** --- Perspectives --- */

  /** Title for popover that explains what "Perspectives" are */
  'perspectives.title': 'Perspectives',

  /** "New label" for Perspectives feature */
  'perspectives.new-label': 'New',

  /** Description for popover that explains what "Perspectives" are */
  'perspectives.description':
    'Perspectives allow your query to run against different "views" of the content in your dataset',

  /** Call to action to read the docs related to "Perspectives" */
  'perspectives.action.docs-link': 'Read docs',

  /** --- Query Pane --- */

  /** Label for "Query" input in the panel in vision */
  'query.query-label': 'Query',

  /** Label for "Params" input in the panel in vision */
  'query.params-label': 'Params',

  /** Error message for when the "Params" input are not a valid json */
  'query.error.params-invalid-json': 'Parameters are not valid JSON',

  /** Label for "Result" input in the Result panel in vision */
  'query.result-label': 'Result',

  /** --- Footer -- */

  /** Label for "Cancel" action when fetching the query */
  'footer.action.cancel': 'Cancel',

  /** Label for "Fetch" action when fetching the query */
  'footer.action.fetch': 'Fetch',

  /** Label for "Stop" action when fetching the query */
  'footer.action.stop': 'Stop',

  /** Label for "Listen" action when fetching the query */
  'footer.action.listen': 'Listen',

  /** Label for "Execution time" information of the fetched query */
  'footer.execution-time-label': 'Execution',

  /** Label for "End to End time" information of the fetched query */
  'footer.end-to-end-time-label': 'End-to-end',

  /** "Not applicable" message for when there is no Execution time or End to End
   * time information availble for the query */
  'footer.not-applicable': 'n/a',
}

/**
 * @alpha
 */
export type VisionLocaleResourceKeys = keyof typeof visionLocaleStrings

export default visionLocaleStrings
