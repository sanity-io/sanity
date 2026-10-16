/* eslint sort-keys: "error" */
import {defineLocalesResources} from 'sanity'

/**
 * Defined locale strings for the vision tool, in US English.
 *
 * @internal
 */
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
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
  'action.save-personal-copy': 'Save personal copy',
  /** Label for saving a personal query */
  'action.save-personal-query': 'Save as personal',
  /** Label for saving a query */
  'action.save-query': 'Save query',
  /** Label for saving a shared query */
  'action.save-shared-query': 'Save as shared',
  /** Label for unsharing a query */
  'action.unshare': 'Unshare',
  /** Label for updating a query */
  'action.update': 'Update',

  /** Label for actions user can take */
  'label.actions': 'Actions',
  /** Label for all saved queries */
  'label.all': 'All',
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
  /** Label for query type "shared" */
  'label.shared': 'Shared',
  /** Label for saved query type "team" */
  'label.team': 'Team',
  /** Label for untitled query fallback */
  'label.untitled-query': 'Untitled',

  /** Error message for when the "Params" input are not a valid json */
  'params.error.params-invalid-json': 'Parameters are not valid JSON',
  /** Label for "Params" (parameters) editor/input */
  'params.label': 'Params',

  /** Label for 'Column' indicator when there is an error within the query */
  'query.error.column': 'Column',
  /** Label for 'Line' indicator when there is an error within the query */
  'query.error.line': 'Line',
  /** Extra explanation when a 400 is returned for a release perspective on an old API version */
  'query.error.unsupported-release-perspective':
    'This API version does not support complex perspectives. Use {{apiVersion}} or later.',
  /** Extra explanation when a 400 is returned for a variant on an incompatible API version */
  'query.error.unsupported-variant':
    'This API version does not support content variants. Use the experimental API version ({{apiVersion}}).',
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
  /** Save personal copy success label */
  'save-query.personal-copy-success': 'Personal copy saved',
  /** Warning displayed before sharing a query */
  'save-query.share-warning':
    'Shared queries are stored as documents in your dataset and count toward your document quota.',
  /** Save shared query success label */
  'save-query.shared-success': 'Shared query saved',
  /** Save success label */
  'save-query.success': 'Query saved',
  /** Save unshared query success label */
  'save-query.unshared-success': 'Query moved to personal',

  /** Label for the "API version" dropdown in settings */
  'settings.api-version-label': 'API version',
  /** Tooltip shown when the API version selector is locked to vX because a variant is selected */
  'settings.api-version-locked-for-variant':
    'When a variant is selected, the API version needs to be vX.',
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
  /** Label for the scheduled drafts perspective */
  'settings.perspectives.scheduled-drafts': 'Scheduled drafts',
  /** Title for popover that explains what "Perspectives" are */
  'settings.perspectives.title': 'Perspectives',

  /** Label of the document after the change in the Delta panel */
  'vista.delta.after': 'After',
  /** Label of the document before the change in the Delta panel */
  'vista.delta.before': 'Before',
  /** What the Delta panel does */
  'vista.delta.description':
    'Runs the query in delta mode, as GROQ-powered webhooks, listeners and Sanity Functions do: before() and after() are a document before and after a change, @ is the document after it, and delta::changedAny() compares them. It runs in the browser with groq-js. An empty side means no document: the change creates or deletes it.',
  /** Label of the document ID field in the Delta panel */
  'vista.delta.document-id': 'Document ID',
  /** Shown when there is a query but no documents to compare */
  'vista.delta.empty': 'Load a document’s history, or write the documents into Before and After.',
  /** Shown when the query fails in delta mode */
  'vista.delta.failed': 'The query could not be run in delta mode: {{message}}',
  /** Shown when the After document is not valid JSON */
  'vista.delta.invalid-after': 'After is not valid JSON: {{message}}',
  /** Shown when the Before document is not valid JSON */
  'vista.delta.invalid-before': 'Before is not valid JSON: {{message}}',
  /** Button loading the document's revisions from the History API */
  'vista.delta.load': 'Load history',
  /** Shown when the history could not be loaded */
  'vista.delta.load-failed': 'The history could not be loaded: {{message}}',
  /** A delta filter that is true for the change */
  'vista.delta.matches': 'Matches: a webhook or function with this filter runs for this change.',
  /** A delta filter that is false for the change */
  'vista.delta.no-match':
    'Does not match: a webhook or function with this filter does not run for this change.',
  /** Shown while the query or its params cannot be sent */
  'vista.delta.no-request': 'Fix the query and its params to run it in delta mode.',
  /** Heading of the delta result */
  'vista.delta.result': 'Result',
  /** A revision in the Before and After lists */
  'vista.delta.revision.option': '{{time}} · {{revision}}',
  /** The After choice for a change that deletes the document */
  'vista.delta.revision.none-after': 'Nothing: the change deletes the document',
  /** The Before choice for a change that creates the document */
  'vista.delta.revision.none-before': 'Nothing: the change creates the document',
  /** Accessible label for the button that closes the sidebar drawer */
  'vista.drawer.close': 'Close panel',
  /** Toast shown after a code snippet was copied */
  'vista.export-query.copied': 'Snippet copied to clipboard',
  /** Label for the button that copies a code snippet */
  'vista.export-query.copy': 'Copy snippet',
  /** Explanation at the top of the export query dialog */
  'vista.export-query.description':
    'Run this query outside of the studio with one of these snippets.',
  /** Title of the dialog that exports the query as code snippets */
  'vista.export-query.title': 'Export query',
  /** Note about authentication in the export query dialog */
  'vista.export-query.token-note':
    'Private datasets need an API token. Public datasets can drop the Authorization header.',
  /** Toast shown after the generated code was copied */
  'vista.export-types.copied': 'Code copied to clipboard',
  /** Label for the button that copies the generated code */
  'vista.export-types.copy': 'Copy code',
  /** Shown in the types dialog when there is neither a schema evaluation nor a result */
  'vista.export-types.empty': 'Fetch the query first so there is a result to derive types from.',
  /** Why the workspace schema could not be used for the types; shown with the result fallback */
  'vista.export-types.schema-error': 'Schema evaluation failed: {{message}}',
  /** Note shown when the types were derived from the fetched result instead of the schema */
  'vista.export-types.source.result':
    'Inferred from the fetched result, since the query could not be evaluated against the workspace schema.',
  /** Note shown when the types were derived from the workspace schema */
  'vista.export-types.source.schema':
    'Inferred from the workspace schema, the same way sanity typegen does it.',
  /** Shown when the schema cannot be evaluated and the shown result belongs to an older query */
  'vista.export-types.stale-result':
    'The result shown was fetched for a different query or params. Fetch the current query first so there is a result to derive types from.',
  /** Title of the dialog exporting TypeScript types for the result */
  'vista.export-types.title-typescript': 'Export TypeScript',
  /** Title of the dialog exporting a Zod schema for the result */
  'vista.export-types.title-zod': 'Export Zod',
  /** Button in the request column's action bar naming the API version requests go out with */
  'vista.api-version.button': 'API {{version}}',
  /** The API version button while queries go through the API CDN */
  'vista.api-version.button-cdn': 'API CDN {{version}}',
  /** The API version button while the "Other" API version input holds an unfinished version */
  'vista.api-version.button-invalid': 'Unfinished API version',
  /** Tooltip of the API version button */
  'vista.api-version.tooltip':
    'Queries run against API version {{version}}. Select to change it in Options.',
  /** Tooltip of the API version button while queries go through the API CDN */
  'vista.api-version.tooltip-cdn':
    'Queries run against the API CDN with API version {{version}}. Select to change it in Options.',
  /**
   * Tooltip of the API version button while the API CDN is asked for but the perspective, as the
   * perspective select names it, keeps queries on the API
   */
  'vista.api-version.tooltip-cdn-blocked':
    'Queries run against the API with API version {{version}}, not the API CDN: it does not serve the {{perspective}} perspective. Select to change it in Options.',
  /** Tooltip of the API version button while the "Other" input holds an unfinished version */
  'vista.api-version.tooltip-invalid':
    'The API version in Options is unfinished, so nothing can be fetched until it is complete.',
  /** Tooltip of the API version button while a selected variant forces the experimental API */
  'vista.api-version.tooltip-locked':
    'Queries run against API version {{version}}, which the selected variant needs.',
  /** Explanation at the top of the Explain panel */
  'vista.explain.description':
    'The query plan is how the Content Lake runs the query: what it reads, filters and sorts while reading, and what is left for later steps. Explain this to me has Sanity Agent Actions describe the query and its plan in plain words.',
  /** Shown in the Explain panel while there is no valid query to explain */
  'vista.explain.empty': 'Write a query to explain it.',
  /** Button in the Explain panel asking Agent Actions to explain the query and its plan */
  'vista.explain.explain': 'Explain this to me',
  /** Shown when the explanation could not be written */
  'vista.explain.failed': 'The query could not be explained: {{message}}',
  /** A count the index computes without reading the documents */
  'vista.explain.insight.aggregate': 'Counted in the index, without reading the documents.',
  /** A subquery the plan runs once for all documents */
  'vista.explain.insight.batched-subquery':
    'The subquery runs once for all the documents, in a single batched fetch, not once per document.',
  /** Part of the filter runs in memory; the expression follows */
  'vista.explain.insight.filter-in-memory':
    'Part of the filter runs in memory, after reading: every document the index lets through is read first, which gets slow on large datasets. Joins (->) and functions in a filter cannot use the index.',
  /** The index sorts and limits while reading */
  'vista.explain.insight.index-sort-limit':
    'The index sorts and limits the documents while reading them.',
  /** The plan slices in memory */
  'vista.explain.insight.slice-in-memory':
    'The slice is taken in memory after reading, not as a limit while reading.',
  /** The plan sorts in memory */
  'vista.explain.insight.sort-in-memory':
    'Sorting happens in memory, after reading every match. Sort by attributes the index can sort by.',
  /** Link under the plan insights to the guide on fast queries */
  'vista.explain.insights.guide': 'High performance GROQ',
  /** Heading of the plan insights in the Explain panel */
  'vista.explain.insights.title': 'What stands out',
  /** Button in the Explain panel fetching the query plan */
  'vista.explain.plan': 'Show the query plan',
  /** Shown when the query plan could not be fetched */
  'vista.explain.plan-failed': 'The query plan could not be fetched: {{message}}',
  /** Heading of the query plan in the Explain panel */
  'vista.explain.plan-title': 'Query plan',
  /** Button of a library function the query does not declare, which declares it at the top */
  'vista.functions.add': 'Add to query',
  /** Shown on a library function the query declares the same way */
  'vista.functions.declared': 'In this query',
  /** Lint action on a call of a library function the query does not declare */
  'vista.functions.editor.add-from-library': 'Declare it',
  /** Note in a function's hover documentation: the API version it needs */
  'vista.functions.editor.api-version': 'Needs API version {{version}} or later',
  /** Detail of a completion for a custom function the query declares */
  'vista.functions.editor.completion-declared': 'in this query',
  /** Detail of a completion for a library function, which declares it too */
  'vista.functions.editor.completion-library': 'from your library',
  /** Note in the hover documentation of a custom function the query declares */
  'vista.functions.editor.declared-on': 'Custom function, declared on line {{line}}',
  /** Note in the hover documentation of the functions that only work in delta mode */
  'vista.functions.editor.delta-only':
    'Only works in delta mode, where webhooks and Sanity Functions run their filters',
  /** Button over a selected projection in the query editor, turning it into a custom function */
  'vista.functions.editor.extract': 'Extract to function',
  /** Note in the hover documentation of a library function the query does not declare */
  'vista.functions.editor.in-library': 'In your functions library, not declared in this query',
  /** Link at the end of a built-in function's hover documentation */
  'vista.functions.editor.reference': 'GROQ functions reference',
  /** Tooltip of the extract button over the query editor, naming the expression it would extract */
  'vista.functions.extract.button': 'Extract {{expression}} to a function',
  /** Tooltip of the extract button while there is nothing to extract, and the toast when it is pressed then */
  'vista.functions.extract.hint':
    'Put the cursor in a projection, like author->{name}, to extract it to a function',
  /** Explanation under the library heading in the Functions panel */
  'vista.functions.library.description':
    'Kept in this browser for every dataset of the project. Completions offer these functions, and lint offers to declare one a query calls.',
  /** Shown in the Functions panel while the library is empty */
  'vista.functions.library.empty': 'Save a function the query declares to use it in other queries.',
  /** Heading of the functions library in the Functions panel */
  'vista.functions.library.title': 'Library',
  /** Shown in the Functions panel while the query declares no custom functions */
  'vista.functions.query.empty':
    'Declare custom functions at the top of the query, or put the cursor in a projection, like author->{name}, and press the extract button over the editor ({{shortcut}}).',
  /** Heading of the functions the query declares in the Functions panel */
  'vista.functions.query.title': 'In this query',
  /** Removes a function from the library */
  'vista.functions.remove': 'Remove from the library',
  /** Button of a library function the query declares differently, which puts the library's version in */
  'vista.functions.replace': 'Replace in query',
  /** Accessible name of a declared function in the Functions panel, which selects it in the editor */
  'vista.functions.reveal': 'Show {{name}} in the editor',
  /** Button of a function the query declares that is not in the library yet */
  'vista.functions.save': 'Save to library',
  /** Shown on a function the query declares the way the library has it */
  'vista.functions.saved': 'Saved',
  /** Button of a function the query declares differently from the library's version */
  'vista.functions.update': 'Update library',
  /** Button over the query editor that opens the bar writing a query from a description */
  'vista.generate.button': 'Generate query',
  /** Closes the generate query bar */
  'vista.generate.close': 'Close',
  /** Explanation under the generate query field */
  'vista.generate.description':
    'Sanity Agent Actions write the GROQ from your description and the document types, and the Content Lake checks each attempt. It runs in this tab while its query is empty, otherwise in a new one.',
  /** Shown when no query could be generated, above the reason */
  'vista.generate.failed': 'The query could not be generated',
  /** Accessible label of the description field in the generate query bar */
  'vista.generate.label': 'What should the query fetch?',
  /** Opens the last rejected attempt, without running it, to fix it by hand */
  'vista.generate.open-anyway': 'Open the last attempt',
  /** Placeholder of the description field in the generate query bar */
  'vista.generate.placeholder':
    'The 10 most recent authors, ordered by last name and then first name',
  /** Shown while the first attempt at a query is written */
  'vista.generate.progress': 'Writing the query…',
  /** Shown while a rejected attempt is retried */
  'vista.generate.progress-retry': 'Fixing the query (attempt {{attempt}} of {{max}})…',
  /** Button generating the query */
  'vista.generate.submit': 'Generate',
  /** A history entry whose result differs from the previous result, which is no longer kept */
  'vista.history.changed': 'Changed',
  /** Badge on a history entry the API CDN answered */
  'vista.history.cdn': 'API CDN',
  /** Badge on a history entry the API CDN answered from its cache */
  'vista.history.cdn-cache-hit': 'CDN cache hit',
  /**
   * Toggle on a history entry that shows how its request and result differ from the previous
   * successful fetch
   */
  'vista.history.changes': 'Changes',
  /** Shown instead of the changes when they could not be loaded or rendered */
  'vista.history.changes-failed': 'The changes could not be shown.',
  /** Button retrying to show the changes of a history entry */
  'vista.history.changes-retry': 'Retry',
  /** Above the changes of a history entry: the fetch they are compared with */
  'vista.history.compared-with': 'Compared with the fetch at {{time}}',
  /** Label of the diff of the GROQ params in a history entry's changes */
  'vista.history.diff.params': 'Params',
  /** Label of the diff of the GROQ query in a history entry's changes */
  'vista.history.diff.query': 'Query',
  /** Instead of the query diff, when the two queries only differ in whitespace and line breaks */
  'vista.history.diff.query-formatting-only': 'Only the formatting changed',
  /** Label of the diff of the query result in a history entry's changes */
  'vista.history.diff.result': 'Result',
  /**
   * Label of the diff of the request URL in a history entry's changes: the API host, version and
   * dataset, and options such as the perspective
   */
  'vista.history.diff.url': 'Request URL',
  /** Empty state of the history panel */
  'vista.history.empty': 'Nothing fetched yet',
  /** Status label for a failed fetch in the history */
  'vista.history.failed': 'Failed',
  /** Button putting the hidden fields back into the diff out of a history entry's changes */
  'vista.history.hide-hidden': 'Hide them',
  /** Next to a history entry's changes: the fields the diff leaves out */
  'vista.history.hiding': 'Hiding {{fields}}',
  /** A history entry whose result only differs from the previous one in hidden fields */
  'vista.history.only-hidden-changed': 'Only hidden fields changed',
  /** History reason: a tab opened with a generated query fetched it */
  'vista.history.reason.generated': 'Generated query',
  /** History reason: mutations were applied from the Mutate panel */
  'vista.history.reason.mutation': 'Mutations applied',
  /** History reason: a live event matched the query's sync tags */
  'vista.history.reason.live': 'Live update',
  /** History reason: the live connection asked every client to refetch */
  'vista.history.reason.live-restart': 'Live connection restarted',
  /**
   * History reason: the Live fetch button was pressed, which fetches and then refetches
   * automatically
   */
  'vista.history.reason.live-start': 'Live fetch started',
  /** History reason: a saved or pasted query was loaded into a tab that refetches automatically */
  'vista.history.reason.load': 'Query loaded',
  /** History reason: the fetch button was pressed */
  'vista.history.reason.manual': 'Fetch button',
  /** History reason: dataset, API version or perspective changed while refetching automatically */
  'vista.history.reason.options': 'Options changed',
  /** History reason: a tab that refetches automatically was opened again, or the studio reloaded */
  'vista.history.reason.resume': 'Automatic refetching resumed',
  /** History reason: the keyboard shortcut was used */
  'vista.history.reason.shortcut': 'Keyboard shortcut',
  /** A history entry whose result is the same as the previous result, for a changed request */
  'vista.history.same-result': 'Same result',
  /** Button showing the hidden fields in a history entry's changes */
  'vista.history.show-hidden': 'Show them',
  /** Next to a history entry's changes while the hidden fields are shown */
  'vista.history.showing-hidden': 'Showing {{fields}}, hidden by default',
  /** A history entry whose result, or the previous one, is too large to compare */
  'vista.history.too-large': 'Too large to compare',
  /** A history entry whose result is the same as the previous result */
  'vista.history.unchanged': 'No changes',
  /** Shown in the Lint panel while the query has no lint findings */
  'vista.lint.empty':
    'No lint findings. Problems the GROQ linter spots in the query are listed here as you type; pick one to select it in the editor.',
  /** Where a lint finding sits in the query, shown under its message */
  'vista.lint.position': 'Line {{line}}, column {{column}}',
  /** Severity badge of a lint finding */
  'vista.lint.severity.error': 'Error',
  /** Severity badge of a lint finding */
  'vista.lint.severity.hint': 'Hint',
  /** Severity badge of a lint finding */
  'vista.lint.severity.info': 'Info',
  /** Severity badge of a lint finding */
  'vista.lint.severity.warning': 'Warning',
  /** Lint action writing the type, field or operator a schema finding suggests */
  'vista.lint.use-suggestion': 'Use {{suggestion}}',
  /** Title the browser shows for the WebMCP tool that lints a query */
  'vista.webmcp.check-query': 'Check a GROQ query in Vision',
  /** Title the browser shows for the WebMCP tool that describes the workspace schema */
  'vista.webmcp.describe-schema': 'Describe the schema in Vision',
  /** Title the browser shows for the WebMCP tool that returns a query plan */
  'vista.webmcp.explain-query': 'Explain a GROQ query in Vision',
  /** Title the browser shows for the WebMCP tool that reads the active Vision tab */
  'vista.webmcp.get-state': 'Read the open Vision tab',
  /** Title the browser shows for the WebMCP tool that opens a query in a new tab */
  'vista.webmcp.open-query': 'Open a GROQ query in Vision',
  /** Title the browser shows for the WebMCP tool that runs mutations as a dry run */
  'vista.webmcp.preview-mutations': 'Preview mutations in Vision',
  /** Title the browser shows for the WebMCP tool that runs a query */
  'vista.webmcp.run-query': 'Run a GROQ query in Vision',
  /** Badge shown while a tab refetches automatically */
  'vista.live.active': 'Live',
  /** Button in the request column's action bar that fetches and then refetches automatically */
  'vista.live.button': 'Live fetch',
  /** Tooltip of the Live button while automatic refetching is off */
  'vista.live.button.start': 'Fetch, then fetch again whenever the documents in the result change',
  /** Tooltip of the Stop live button, while the tab refetches automatically */
  'vista.live.button.stop':
    'Stop fetching when the documents in the result change. Fetch still fetches on demand, for results no document change touches, like now()',
  /** Error shown when the live connection breaks */
  'vista.live.error': 'Live updates disconnected: {{message}}',
  /** The Live fetch button while the tab refetches automatically, stopping it */
  'vista.live.stop': 'Stop live',
  /** Button in the Mutate panel adding a mutation to the list */
  'vista.mutate.add': 'Add mutation',
  /** Adds a mutation creating a document, with the type of the result's first document */
  'vista.mutate.add.create': 'Create a document',
  /** Adds a mutation deleting a document, its ID to fill in */
  'vista.mutate.add.delete': 'Delete a document',
  /** Adds a mutation deleting the documents of the shown result */
  'vista.mutate.add.delete-result': 'Delete the documents in the result',
  /** Adds a mutation patching a document, its ID to fill in */
  'vista.mutate.add.patch': 'Patch a document',
  /** Adds a mutation patching the documents of the shown result */
  'vista.mutate.add.patch-result': 'Patch the documents in the result',
  /** Button applying the mutations a dry run showed */
  'vista.mutate.apply': 'Apply to {{dataset}}',
  /** Heading of the error shown when applying the mutations failed */
  'vista.mutate.apply-failed': 'The mutations were not applied',
  /** Next to Apply while the mutations as they are have had no dry run */
  'vista.mutate.apply-needs-preview': 'Apply sends what a dry run showed: run one first.',
  /** Shown once the mutations were applied */
  'vista.mutate.applied':
    'Applied to {{dataset}} in transaction {{transactionId}}. Documents changed: {{count}}. The query was fetched again.',
  /** Option giving array items without a _key one */
  'vista.mutate.auto-keys': 'Add a _key to array items that have none',
  /** Under the option giving array items a _key */
  'vista.mutate.auto-keys.description': 'The studio needs one on every array item to edit it.',
  /** Button showing a document's changes in the dry run */
  'vista.mutate.changes': 'Changes',
  /** Shown instead of a document's changes when they could not be loaded or rendered */
  'vista.mutate.changes-failed': 'The changes could not be shown.',
  /** Button retrying to show a document's changes */
  'vista.mutate.changes-retry': 'Retry',
  /** What the Mutate panel does */
  'vista.mutate.description':
    'Write mutations as the Mutations API takes them, in a list: create, createOrReplace, createIfNotExists, delete and patch, by ID or by a GROQ query. A dry run shows what they would do to each document without changing anything; Apply then writes them to the dataset in one transaction, with your account.',
  /** What the API says went wrong with one of the mutations */
  'vista.mutate.failure-item': 'Mutation {{index}}: {{message}}',
  /** Under the dry run: the fields the diffs leave out */
  'vista.mutate.hiding': 'The changes leave out {{fields}}, as History does.',
  /** Shown when the mutations are not valid JSON */
  'vista.mutate.invalid-json': 'The mutations are not valid JSON: {{message}}',
  /** Shown when a mutation does not name exactly one thing to do */
  'vista.mutate.invalid-mutation':
    'Mutation {{index}} needs exactly one of create, createOrReplace, createIfNotExists, delete or patch.',
  /** Label of the mutations editor */
  'vista.mutate.mutations': 'Mutations',
  /** The dry run touched no documents */
  'vista.mutate.no-documents': 'The mutations touch no documents.',
  /** Shown when the JSON is not a list of mutations */
  'vista.mutate.not-a-list':
    'Write a list of mutations, a single mutation, or a request body with a list of mutations.',
  /** Under the dry run when it touched more documents than it compares */
  'vista.mutate.not-shown': 'Documents also touched, not compared here: {{count}}',
  /** A document the mutations create */
  'vista.mutate.operation.create': 'Create',
  /** A document the mutations delete */
  'vista.mutate.operation.delete': 'Delete',
  /** A document the mutations touch without changing its content */
  'vista.mutate.operation.none': 'No change',
  /** A document the mutations change */
  'vista.mutate.operation.update': 'Update',
  /** Button running the mutations as a dry run */
  'vista.mutate.preview': 'Dry run',
  /** Heading of the error shown when the dry run failed */
  'vista.mutate.preview-failed': 'The dry run failed',
  /** Heading of the dry run's outcome */
  'vista.mutate.preview-heading': 'Dry run',
  /** Shown over a dry run made for other mutations, another dataset or other options */
  'vista.mutate.stale':
    'The mutations, the dataset or the options changed after this dry run. Run it again to apply them.',
  /** How many documents the dry run changes and leaves as they are */
  'vista.mutate.summary': 'Changed: {{changed}} · Unchanged: {{unchanged}}',
  /** In the Network panel: whether a cache answered the query */
  'vista.network.cache': 'Cache',
  /** The API CDN answered from its cache */
  'vista.network.cache.hit': 'Hit',
  /** Under the details of a CDN cache hit */
  'vista.network.cache.hit-explained':
    'The CDN answered with a response it had cached, from a location near you; the query did not reach the API.',
  /** The API CDN answered with a response this session had not seen */
  'vista.network.cache.miss': 'Miss, as far as this session can tell',
  /** The API answered, which caches nothing */
  'vista.network.cache.none': 'None, the API answers every request with fresh content',
  /** Shown in the Network panel while there is no response */
  'vista.network.empty':
    'Fetch the query to see which endpoint answered it, whether from a cache, and where it ran.',
  /** In the Network panel: the endpoint that answered */
  'vista.network.endpoint': 'Answered by',
  /** The live API answered */
  'vista.network.endpoint.api': 'API',
  /** The API CDN answered */
  'vista.network.endpoint.cdn': 'API CDN',
  /** In the Network panel: the region the query ran in */
  'vista.network.region': 'Query ran in',
  /** The response did not say where the query ran */
  'vista.network.region.unknown': 'Not reported',
  /** In the Network panel: the round trip and the time on the server */
  'vista.network.timing': 'Time',
  /** The round trip and the server's time for the query, in milliseconds */
  'vista.network.timing.value': '{{e2e}}ms round trip, {{server}}ms on the server',
  /** In the Network panel: the trace of the request, for Sanity support */
  'vista.network.trace': 'Trace ID',
  /** Hint in the Network panel while queries go to the API */
  'vista.network.use-cdn-hint':
    'Turn on Use the API CDN in Options to send queries through the CDN.',
  /** Label of the browser's marker on the Network panel's globe, placed from its time zone */
  'vista.network.you': 'You',
  /** Hint under the dataset field while the tab follows the workspace's dataset */
  'vista.options.dataset.follows-workspace': 'Follows the workspace',
  /** Button that pins the current dataset so the tab stops following the workspace */
  'vista.options.dataset.pin': 'Pin a dataset',
  /** Hint under the dataset field while a dataset is pinned */
  'vista.options.dataset.pinned': 'Pinned; the workspace may use another dataset',
  /** Button that makes the tab follow the workspace's dataset again */
  'vista.options.dataset.use-workspace': 'Use the workspace dataset',
  /** Label for the "Include content source map" switch */
  'vista.options.include-source-map': 'Include content source map',
  /** Description for the "Include content source map" switch */
  'vista.options.include-source-map.description':
    'Adds resultSourceMap to the response, shown in the Content Source Map tab.',
  /** Label of the switch that sends queries to the API CDN */
  'vista.options.use-cdn': 'Use the API CDN',
  /** Note under the API CDN switch while the studio signs in with a cookie */
  'vista.options.use-cdn.anonymous':
    'This studio signs you in with a cookie, which the API CDN never receives: it answers as it would an anonymous visitor, with what a public dataset shows.',
  /**
   * Why the API CDN is asked for but not used: the perspective is the one the perspective
   * select shows, such as "Global (drafts)"
   */
  'vista.options.use-cdn.blocked':
    'The API CDN does not serve drafts or releases, so queries with the {{perspective}} perspective go to the API. With published or raw they use the CDN.',
  /** Heading of the notice shown while the perspective keeps queries off the API CDN */
  'vista.options.use-cdn.blocked.title': 'Queries go to the API, not the CDN',
  /** Description of the API CDN switch */
  'vista.options.use-cdn.description':
    'Sends the query to the API CDN, like useCdn: true in @sanity/client, with the published and raw perspectives: drafts and releases always go to the API. Its answers are cached for up to a minute; the Network panel shows when one came from the cache.',
  /** Button in the API CDN notice switching the tab to the published perspective */
  'vista.options.use-cdn.use-published': 'Use the published perspective',
  /** Perspective option following the studio navbar; the name is the release, published or drafts */
  'vista.options.perspective.global': 'Global ({{name}})',
  /** Variant option sending the navbar's variant, named */
  'vista.options.variant.global': 'Global ({{name}})',
  /** Variant option sending the navbar's variant while none is selected there */
  'vista.options.variant.global-none': 'Global (none selected)',
  /** Variant option sending no variant */
  'vista.options.variant.none': 'None',
  /** Label of the variant field */
  'vista.options.variant-label': 'Variant',
  /** Accessible label for collapsing a bottom panel */
  'vista.panel.collapse': 'Collapse panel',
  /** Accessible label for expanding a bottom panel */
  'vista.panel.expand': 'Expand panel',
  /** Label of the "Explain" tab in the response panel: the query plan and an explanation */
  'vista.panel.explain': 'Explain',
  /** Label of the Functions tab in the response panel */
  'vista.panel.functions': 'Functions',
  /** Label of the Network tab in the response panel */
  'vista.panel.network': 'Network',
  /** Label of the Delta tab in the response panel, which tests the query in delta mode */
  'vista.panel.delta': 'Delta',
  /** Label of the Mutate tab in the response panel, which runs and applies mutations */
  'vista.panel.mutate': 'Mutate',
  /** Label of the "History" tab in the response panel */
  'vista.panel.history': 'History',
  /** Label of the "Lint" tab in the response panel, listing the query's lint findings */
  'vista.panel.lint': 'Lint',
  /** Label of the "Options" panel in the request column */
  'vista.panel.options': 'Options',
  /** Label of the "Response" tab in the response panel */
  'vista.panel.response': 'Response',
  /** Label of the "Content Source Map" tab in the response panel */
  'vista.panel.source-map': 'Content Source Map',
  /** Button adding an item to a list param in the params form */
  'vista.params-form.add-item': 'Add item',
  /** Placeholder of a params form field that takes any JSON value */
  'vista.params-form.any-placeholder': 'Any JSON value; other text is sent as a string',
  /** Shown in the params form when the query uses no params */
  'vista.params-form.empty': 'The query uses no params. Each $name in it gets a field here.',
  /** Shown in the params form while the params JSON cannot be parsed */
  'vista.params-form.invalid-json':
    'The params are not valid JSON. Fix them in the JSON view to edit them here.',
  /** A boolean param's value is not true or false; it is sent anyway */
  'vista.params-form.invalid.boolean': 'Not true or false; sent as {{value}}',
  /** A document type param's value is not a document type of the workspace; it is sent anyway */
  'vista.params-form.invalid.document-type': 'Not a document type in this workspace; sent anyway',
  /** A whole number param (a slice bound) holds a fraction */
  'vista.params-form.invalid.integer': 'Not a whole number, which slices need',
  /** A list param's value is not a list; it is sent anyway */
  'vista.params-form.invalid.list': 'Not a list; sent as {{value}}',
  /** A number param's value is not a number; it is sent anyway */
  'vista.params-form.invalid.number': 'Not a number; sent as text',
  /** A param's value is not one of the values the schema allows; it is sent anyway */
  'vista.params-form.invalid.option': 'Not one of the known values; sent anyway',
  /** A text param's value is not text; it is sent anyway */
  'vista.params-form.invalid.string': 'Not text; sent as {{value}}',
  /** Accessible label of an item input of a list param in the params form */
  'vista.params-form.item-label': '${{name}}, item {{index}}',
  /** Placeholder of an item input of a list param in the params form */
  'vista.params-form.item-placeholder': 'Item',
  /** Under a params form field whose param has no value */
  'vista.params-form.missing': 'Not set: the query fails until it has a value',
  /** Shown in the params form when the workspace schema could not be read */
  'vista.params-form.no-schema':
    'Types come from the query alone: the workspace schema could not be read.',
  /** Placeholder of a params form field without a value, and the unset choice of a boolean */
  'vista.params-form.not-set': 'Not set',
  /** Button setting a date and time param to the current time */
  'vista.params-form.now': 'Now',
  /** Button removing a param the query does not use from the params */
  'vista.params-form.remove': 'Remove',
  /** Accessible label of the button removing an item from a list param */
  'vista.params-form.remove-item': 'Remove item',
  /** Shown in the params form when the query does not parse */
  'vista.params-form.syntax-error':
    'The query does not parse, so its params are listed without types.',
  /** Type hint of a params form field: any JSON value */
  'vista.params-form.type.any': 'any JSON value',
  /** Type hint of a params form field: true or false */
  'vista.params-form.type.boolean': 'true or false',
  /** Type hint of a params form field: an ISO 8601 date and time */
  'vista.params-form.type.datetime': 'date and time (ISO 8601)',
  /** Type hint of a params form field: a document ID */
  'vista.params-form.type.document-id': 'document ID',
  /** Type hint of a params form field: one of the workspace's document types */
  'vista.params-form.type.document-type': 'document type',
  /** Type hint of a params form field: a whole number */
  'vista.params-form.type.integer': 'whole number',
  /** Type hint of a params form field: a list of values */
  'vista.params-form.type.list': 'list, each {{type}}',
  /** Type hint of a params form field: a number */
  'vista.params-form.type.number': 'number',
  /** Type hint of a params form field: one of the values the schema allows */
  'vista.params-form.type.options': '{{type}}, one of {{count}} values',
  /** Type hint of a params form field: text */
  'vista.params-form.type.string': 'text',
  /** Heading of the params the query does not use, listed in the params form */
  'vista.params-form.unused': 'Not used by the query',
  /** Before the expressions that use a param, in the params form */
  'vista.params-form.used-in': 'Used in',
  /** Value announced for the params resize handle while the panel sizes itself to its content */
  'vista.params.fit-height': 'Sized to the content, {{height}} pixels',
  /** Accessible label and tooltip of the handle for resizing the params panel */
  'vista.params.resize':
    'Resize params: drag or use the arrow keys; double-click or press Enter to fit the content again',
  /** Tab showing the params as a form inferred from the query */
  'vista.params.view.form': 'Form',
  /** Tab showing the params as JSON */
  'vista.params.view.json': 'JSON',
  /** Accessible label of the tabs switching how the params are edited */
  'vista.params.view.label': 'Edit params as',
  /** Toast shown after a query URL was pasted and loaded into the tab */
  'vista.paste.parsed': 'Loaded query from pasted URL',
  /** Toast shown when a pasted URL used a content variant the tab does not send */
  'vista.paste.unavailable-variant':
    'The pasted URL used the "{{variant}}" variant; select it in the navbar to run the query with it.',
  /** Toast shown when the dataset of a pasted URL is not available here */
  'vista.paste.unknown-dataset':
    'The dataset "{{dataset}}" in the pasted URL is not available here, keeping the current one.',
  /** Toast shown when the perspective of a pasted URL cannot be used */
  'vista.paste.unsupported-perspective':
    'The perspective in the pasted URL is not supported here, keeping the current one.',
  /** Accessible label for the query actions menu */
  'vista.query.actions': 'Query actions',
  /** Tooltip when automatic refetching is not available for the API version */
  'vista.query.auto-refetch.unsupported':
    'Refetching automatically needs API version v2021-03-25 or later.',
  /** Toast shown after the query was copied */
  'vista.query.copied': 'Query copied to clipboard',
  /** Menu item copying the query text */
  'vista.query.copy': 'Copy query',
  /** Menu item opening the export query dialog */
  'vista.query.export': 'Export query…',
  /** Menu item reformatting the query */
  'vista.query.prettify': 'Prettify query',
  /** Toast shown when the query could not be reformatted */
  'vista.query.prettify.failed': 'Could not prettify the query',
  /** Menu item saving the query to the personal saved queries */
  'vista.query.save': 'Save query',
  /** The Fetch button while a fetch is running, stopping it; paired with Stop live */
  'vista.query.stop': 'Stop',
  /** Tooltip and accessible label of the Stop button, which stops the running fetch only */
  'vista.query.stop.description': 'Stop fetching',
  /** Explanation in the settings section about the redesigned experience */
  'vista.redesign.settings.description':
    'You are using the redesigned Vision tool. Switching back keeps your tabs and settings in this browser for the next time you try it.',
  /** Title of the settings section about the redesigned experience */
  'vista.redesign.settings.title': 'Redesigned Vision (beta)',
  /** Sidebar item and settings button that return to the classic Vision tool */
  'vista.redesign.switch-to-classic': 'Switch to classic Vision',
  /** Toast button that switches to the redesigned tool */
  'vista.redesign.toast.accept': 'Try it now',
  /** Button next to Fetch in the classic tool that switches to the redesigned one */
  'vista.redesign.try': 'Try the redesign',
  /** Tooltip of the button next to Fetch in the classic tool that switches to the redesign */
  'vista.redesign.try.description':
    'Switch to the redesigned Vision, in beta. You can switch back at any time from its sidebar.',
  /** Body of the toast inviting users of the classic tool to try the redesign */
  'vista.redesign.toast.description':
    'Query tabs, live refetching, response details and exports. You can switch back at any time.',
  /** Toast button that hides the invitation */
  'vista.redesign.toast.dismiss': 'Not now',
  /** Title of the toast inviting users of the classic tool to try the redesign */
  'vista.redesign.toast.title': 'Try the redesigned Vision',
  /** Empty state of the response panel before anything was fetched */
  'vista.response.empty': 'Nothing fetched yet',
  /** Label for the payload size in the response tab */
  'vista.response.payload-size': 'Payload size',
  /** Label for the sync tags in the response tab */
  'vista.response.sync-tags': 'Sync tags',
  /** Shown when the response carried no sync tags */
  'vista.response.sync-tags.none': 'No sync tags in the response',
  /** Accessible label for the result actions menu */
  'vista.result.actions': 'Result actions',
  /** Toast shown after the result was copied */
  'vista.result.copied': 'Result copied to clipboard',
  /** Toast shown after a value in the result was copied, with its path such as [0].author.name */
  'vista.result.copied-value': 'Copied {{path}}',
  /** Menu item and button copying the result as JSON */
  'vista.result.copy': 'Copy result',
  /** Button next to each property in the result tree, copying its value */
  'vista.result.copy-value': 'Copy value',
  /** Empty state of the result view */
  'vista.result.empty': 'Run the query to see its result here',
  /** Button exporting the result as CSV */
  'vista.result.export-csv': 'Export CSV',
  /** Button on a graph node hiding the objects and arrays it holds */
  'vista.result.graph.collapse': 'Hide what it holds',
  /** Button on a collapsed graph node showing the objects and arrays it holds again */
  'vista.result.graph.expand': 'Show the {{count}} objects and arrays it holds',
  /** Button fitting the whole graph in view */
  'vista.result.graph.fit': 'Fit to view',
  /** Accessible label of the graph, saying how to move around in it */
  'vista.result.graph.label':
    'Result graph: drag to move, scroll to zoom; while focused, the arrow keys move, + and - zoom, 0 fits',
  /** The last row of a graph node with more entries than it lists */
  'vista.result.graph.more': '… {{count}} more',
  /** Title of the graph node of the result itself */
  'vista.result.graph.root': 'result',
  /** Ends the note on a graph that leaves part of this result out */
  'vista.result.graph.left-out-hint': 'The tree and JSON views show all of it.',
  /** Note on a graph of a result with more objects and arrays than it draws */
  'vista.result.graph.node-limit': 'Only the first {{nodes}} objects and arrays are drawn.',
  /**
   * Note on a graph whose objects or arrays have more entries than it lists; the nodes are the
   * ones in this result, each with its number of entries
   */
  'vista.result.graph.partial': 'Only the first {{rows}} entries are listed for {{nodes}}.',
  /** After the objects and arrays the note names, how many more list only their first entries */
  'vista.result.graph.partial.more': 'and {{count}} more',
  /** An object or array in the note, with how many entries it has (always more than listed) */
  'vista.result.graph.partial.node': '{{name}} ({{entries}} entries)',
  /** Button zooming into the graph */
  'vista.result.graph.zoom-in': 'Zoom in',
  /** Button zooming out of the graph */
  'vista.result.graph.zoom-out': 'Zoom out',
  /** Button exporting the result as JSON */
  'vista.result.export-json': 'Export JSON',
  /** Menu item opening the TypeScript export dialog */
  'vista.result.export-typescript': 'Export TypeScript…',
  /** Menu item opening the Zod export dialog */
  'vista.result.export-zod': 'Export Zod…',
  /** Tab showing the result as a graph of its objects and arrays */
  'vista.result.view.graph': 'Graph',
  /** Tab showing the result as indented JSON text, to select and copy from */
  'vista.result.view.json': 'JSON',
  /** Accessible label of the tabs that switch how the result shows */
  'vista.result.view.label': 'Result view',
  /** Tab showing the result as a tree to browse */
  'vista.result.view.tree': 'Tree',
  /** Empty state of the saved queries panel */
  'vista.saved.empty': 'No saved queries yet. Save the current query with the + button.',
  /** Empty state of a query list when the search matches nothing */
  'vista.saved.empty-search': 'No queries match your search',
  /** Menu item loading a saved query into the active tab */
  'vista.saved.load-in-current-tab': 'Load into current tab',
  /** Menu item opening a saved query in a new tab */
  'vista.saved.open-in-new-tab': 'Open in new tab',
  /** Menu item renaming a saved query */
  'vista.saved.rename': 'Rename',
  /** Accessible label for the button saving the current query */
  'vista.saved.save-current': 'Save current query',
  /** Toast shown when an opened saved query used a content variant the tab does not send */
  'vista.saved.unavailable-variant':
    'This saved query used the "{{variant}}" variant; select it in the navbar to run the query with it.',
  /** Toast shown when an opened saved query names a dataset that is not available here */
  'vista.saved.unknown-dataset':
    'The dataset "{{dataset}}" of this saved query is not available here, keeping the current one.',
  /** Button in the settings dialog that clears the stored state */
  'vista.settings.clear-storage': 'Clear storage',
  /** Confirmation button for clearing the storage */
  'vista.settings.clear-storage.confirm': 'Yes, clear storage',
  /** Explanation of what clearing the storage does */
  'vista.settings.clear-storage.description':
    'Deletes your personal saved queries and the functions library, resets the open tabs and these defaults in this browser, and returns to the classic Vision tool. Shared queries are kept.',
  /** Toast shown when the saved queries could not be cleared */
  'vista.settings.clear-storage.error': 'Could not clear the saved queries',
  /** Toast shown after the storage was cleared */
  'vista.settings.clear-storage.success': 'Storage cleared',
  /** Explanation at the top of the settings dialog */
  'vista.settings.description': 'Defaults for new tabs. Open tabs keep their own options.',
  /** Explains the setting listing the fields left out of History diffs */
  'vista.settings.history-diff.description':
    'One field path per line. A path matches at any depth of a result, so _rev hides the revision of every document in it. Each diff can still show them.',
  /** Button restoring the default fields left out of History diffs */
  'vista.settings.history-diff.reset': 'Reset to the defaults',
  /** Label of the setting listing the fields left out of History diffs */
  'vista.settings.history-diff.title': 'Fields hidden from History diffs',
  /** Title of the settings dialog */
  'vista.settings.title': 'Settings',
  /** Empty state of the shared queries panel */
  'vista.shared.empty':
    'No shared queries yet. Share a saved query to make it available to everyone using this dataset.',
  /** Shortcut description: close dialogs and menus */
  'vista.shortcuts.close': 'Close dialogs and menus',
  /** Shortcut that lists the functions matching the name being typed in the query editor */
  'vista.shortcuts.complete': 'Complete a function name',
  /** Shortcut description: copy the query */
  'vista.shortcuts.copy-query': 'Copy the query',
  /** Shortcut that turns the selected projection, or the one around the cursor, into a custom function */
  'vista.shortcuts.extract-function': 'Extract the projection at the cursor to a function',
  /** Shortcut description: run the query */
  'vista.shortcuts.fetch': 'Fetch the query',
  /** Shortcut description: move the cursor to the next lint finding in the query editor */
  'vista.shortcuts.next-finding': 'Jump to the next lint finding',
  /** Shortcut description: reformat the query */
  'vista.shortcuts.prettify': 'Prettify the query',
  /** Title of the keyboard shortcuts dialog */
  'vista.shortcuts.title': 'Keyboard shortcuts',
  /** Sidebar toggle: show icons only */
  'vista.sidebar.collapse': 'Collapse sidebar',
  /** Sidebar toggle: show labels next to the icons */
  'vista.sidebar.expand': 'Expand sidebar',
  /** Accessible label for the sidebar navigation */
  'vista.sidebar.label': 'Vista sidebar',
  /** Sidebar item and drawer title for personal saved queries */
  'vista.sidebar.saved-queries': 'Saved queries',
  /** Sidebar item opening the settings dialog */
  'vista.sidebar.settings': 'Settings',
  /** Sidebar item and drawer title for shared queries */
  'vista.sidebar.shared-queries': 'Shared queries',
  /** Sidebar item opening the keyboard shortcuts dialog */
  'vista.sidebar.shortcuts': 'Keyboard shortcuts',
  /** Empty state of the content source map panel */
  'vista.source-map.empty':
    'No content source map in the response. Turn on "Include content source map" under Options and fetch again.',
  /** Accessible label of the divider between the result and the response details panel */
  'vista.split.bottom-panel':
    'Resize the response details panel: drag or use the arrow keys; Home and End go to the bounds, Enter resets',
  /** Accessible label of the divider between the request and response panes */
  'vista.split.request-response':
    'Resize the request and response panes: drag or use the arrow keys; Home and End go to the bounds, Enter resets',
  /** Accessible label for the button closing a query tab */
  'vista.tabs.close-tab': 'Close tab',
  /** Accessible label for the list of query tabs */
  'vista.tabs.label': 'Query tabs',
  /** Accessible label for the button opening a new query tab */
  'vista.tabs.new-tab': 'New tab',
  /** Placeholder of the input renaming a tab */
  'vista.tabs.title-placeholder': 'Tab title',
  /** Title of a tab whose query is still empty */
  'vista.tabs.untitled': 'Untitled query',
} as const)

/**
 * @alpha
 */
export type VisionLocaleResourceKeys = keyof typeof visionLocaleStrings

export default visionLocaleStrings
