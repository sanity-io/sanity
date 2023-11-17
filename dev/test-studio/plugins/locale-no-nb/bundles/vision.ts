import type {VisionLocaleResourceKeys} from '@sanity/vision'

const visionLocaleStrings: Record<VisionLocaleResourceKeys, string> = {
  /**
   * Context: "Vision" is a Sanity studio plugin which allows users to execute GROQ-queries
   * against their dataset and see the results in different ways. It is often used to explore
   * a dataset, debug queries and get a better understanding of the data.
   */

  /**
   * Some features has a "New" label indicating that the feature was recently introduced.
   * This defines what the text of that label is. Keep it short and sweet.
   */
  'label.new': 'Nyhet',

  /** --- Settings --- */

  /** Label for the "Dataset" dropdown in vision settings */
  'settings.dataset-label': 'Datasett',

  /** Label for the "API version" dropdown in settings */
  'settings.api-version-label': 'API-versjon',

  /** Label for the "other" versions within the "API version" dropdown */
  'settings.other-api-version-label': 'Annen',

  /** Label for the "Custom API version" input in settings, shown when "other" is chosen as API version */
  'settings.custom-api-version-label': 'Egendefinert API-versjon',

  /** Error label for when the API version in 'Custom API version' input is invalid */
  'settings.error.invalid-api-version': 'Ugyldig API-versjon',

  /**
   * Label for the "Perspective" dropdown in vision settings
   * @see {@link https://www.sanity.io/docs/perspectives}
   */
  'settings.perspective-label': 'Perspektiv',

  /** Title for popover that explains what "Perspectives" are */
  'settings.perspectives.title': 'Perspektiver',

  /** Description for popover that explains what "Perspectives" are */
  'settings.perspectives.description':
    'Perspektiver lar deg kjøre spørringen din mot forskjellige "visninger" av innholdet i datasettet ditt',

  /** Call to action to read the docs related to "Perspectives" */
  'settings.perspectives.action.docs-link': 'Les dokumentasjon',

  /** --- Query editor --- */

  /** Label for "Query" editor/input */
  'query.label': 'Spørring',

  /** Label for 'Line' indicator when there is an error within the query */
  'query.error.line': 'Linje',

  /** Label for 'Column' indicator when there is an error within the query */
  'query.error.column': 'Kolonne',

  /** Label for the "Query URL" field, shown after executing a query, and allows for copying */
  'query.url': 'URL',

  /** --- Params editor --- */

  /** Label for "Params" (parameters) editor/input */
  'params.label': 'Parametere',

  /** Error message for when the "Params" input are not a valid json */
  'params.error.params-invalid-json': 'Parametere er ikke gyldig JSON',

  /** --- Results view/explorer --- */

  /** Label for "Result" explorer/view */
  'result.label': 'Resultat',

  /** Label for "Execution time" information of the fetched query */
  'result.execution-time-label': 'Utførelsestid',

  /** Label for "End to End time" information of the fetched query */
  'result.end-to-end-time-label': 'Ende-til-ende',

  /** "Not applicable" message for when there is no Execution time or End to End time information
   * available for the query (eg when the query has not been executed, or errored) */
  'result.timing-not-applicable': '-',

  /** --- Actions -- */

  /** Label for executing the query, eg doing a fetch */
  'action.query-execute': 'Utfør',

  /** Label for cancelling an ongoing query */
  'action.query-cancel': 'Avbryt',

  /** Label for setting up a listener */
  'action.listen-execute': 'Lytt',

  /** Label for stopping an ongoing listen operation */
  'action.listen-cancel': 'Stopp',

  /** Label for action "Copy to clipboard", tied to the "Query URL" field. Also used for accessibility purposes on button */
  'action.copy-url-to-clipboard': 'Kopier til utklippstavle',
}

export default visionLocaleStrings
