/* eslint sort-keys: "error" */
import {defineLocalesResources} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'

/**
 * Defined locale strings for the vision tool, in US English.
 *
 * @internal
 */
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
const visionLocaleStrings = defineLocalesResources('vision', {
  /** Label for action "Copy to clipboard", tied to the "Query URL" field. Also used for accessibility purposes on button */
  'action.copy-url-to-clipboard': 'Copy to clipboard',
  /**
   * Label for deleting a query
   * @deprecated no longer in use
   */
  // oxlint-disable-next-line no-deprecated -- locale keys are kept for studios on older versions
  'action.delete': 'Delete',
  /**
   * Label for editing a query's title
   * @deprecated no longer in use
   */
  // oxlint-disable-next-line no-deprecated -- locale keys are kept for studios on older versions
  'action.edit-title': 'Edit title',
  /**
   * Label for stopping an ongoing listen operation
   * @deprecated no longer in use
   */
  // oxlint-disable-next-line no-deprecated -- locale keys are kept for studios on older versions
  'action.listen-cancel': 'Stop',
  /**
   * Label for setting up a listener
   * @deprecated no longer in use
   */
  // oxlint-disable-next-line no-deprecated -- locale keys are kept for studios on older versions
  'action.listen-execute': 'Listen',
  /**
   * Label for query loading table
   * @deprecated no longer in use
   */
  // oxlint-disable-next-line no-deprecated -- locale keys are kept for studios on older versions
  'action.load-queries': 'Load queries',
  /**
   * Label for loading a query
   * @deprecated no longer in use
   */
  // oxlint-disable-next-line no-deprecated -- locale keys are kept for studios on older versions
  'action.load-query': 'Load query',
  /** Label for cancelling an ongoing query */
  'action.query-cancel': 'Cancel',
  /** Label for executing the query, eg doing a fetch */
  'action.query-execute': 'Fetch',
  /**
   * Label for saving a query
   * @deprecated no longer in use
   */
  // oxlint-disable-next-line no-deprecated -- locale keys are kept for studios on older versions
  'action.save-personal-copy': 'Save personal copy',
  /**
   * Label for saving a personal query
   * @deprecated no longer in use
   */
  // oxlint-disable-next-line no-deprecated -- locale keys are kept for studios on older versions
  'action.save-personal-query': 'Save as personal',
  /**
   * Label for saving a query
   * @deprecated no longer in use
   */
  // oxlint-disable-next-line no-deprecated -- locale keys are kept for studios on older versions
  'action.save-query': 'Save query',
  /**
   * Label for saving a shared query
   * @deprecated no longer in use
   */
  // oxlint-disable-next-line no-deprecated -- locale keys are kept for studios on older versions
  'action.save-shared-query': 'Save as shared',
  /**
   * Label for unsharing a query
   * @deprecated no longer in use
   */
  // oxlint-disable-next-line no-deprecated -- locale keys are kept for studios on older versions
  'action.unshare': 'Unshare',
  /**
   * Label for updating a query
   * @deprecated no longer in use
   */
  // oxlint-disable-next-line no-deprecated -- locale keys are kept for studios on older versions
  'action.update': 'Update',

  /**
   * Label for actions user can take
   * @deprecated no longer in use
   */
  // oxlint-disable-next-line no-deprecated -- locale keys are kept for studios on older versions
  'label.actions': 'Actions',
  /**
   * Label for all saved queries
   * @deprecated no longer in use
   */
  // oxlint-disable-next-line no-deprecated -- locale keys are kept for studios on older versions
  'label.all': 'All',
  /**
   * Label for saved queries that have been edited
   * @deprecated no longer in use
   */
  // oxlint-disable-next-line no-deprecated -- locale keys are kept for studios on older versions
  'label.edited': 'Edited',

  /**
   * Some features has a "New" label indicating that the feature was recently introduced.
   * This defines what the text of that label is. Keep it short and sweet.
   * @deprecated no longer in use
   */
  // oxlint-disable-next-line no-deprecated -- locale keys are kept for studios on older versions
  'label.new': 'New',
  /**
   * Label for query type "personal"
   * @deprecated no longer in use
   */
  // oxlint-disable-next-line no-deprecated -- locale keys are kept for studios on older versions
  'label.personal': 'Personal',
  /**
   * Label for savedAt date
   * @deprecated no longer in use
   */
  // oxlint-disable-next-line no-deprecated -- locale keys are kept for studios on older versions
  'label.saved-at': 'Saved at',
  /**
   * Saved queries
   * @deprecated no longer in use
   */
  // oxlint-disable-next-line no-deprecated -- locale keys are kept for studios on older versions
  'label.saved-queries': 'Saved queries',
  /** Search queries */
  'label.search-queries': 'Search queries',
  /** Share query */
  'label.share': 'Share',
  /**
   * Label for query type "shared"
   * @deprecated no longer in use
   */
  // oxlint-disable-next-line no-deprecated -- locale keys are kept for studios on older versions
  'label.shared': 'Shared',
  /**
   * Label for saved query type "team"
   * @deprecated no longer in use
   */
  // oxlint-disable-next-line no-deprecated -- locale keys are kept for studios on older versions
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
    'This API version does not support content variants. Use {{apiVersion}} or later.',
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
  /**
   * Label for "Save result as" result action
   * @deprecated no longer in use
   */
  // oxlint-disable-next-line no-deprecated -- locale keys are kept for studios on older versions
  'result.save-result-as-format': 'Save result as <SaveResultButtons/>',
  /**
   * "Not applicable" message for when there is no Execution time or End to End time information
   * available for the query (eg when the query has not been executed, or errored)
   */
  'result.timing-not-applicable': 'n/a',

  /**
   * Query already saved error label
   * @deprecated no longer in use
   */
  // oxlint-disable-next-line no-deprecated -- locale keys are kept for studios on older versions
  'save-query.already-saved': 'Query already saved',
  /** Save error label */
  'save-query.error': 'Error saving query',
  /**
   * Save personal copy success label
   * @deprecated no longer in use
   */
  // oxlint-disable-next-line no-deprecated -- locale keys are kept for studios on older versions
  'save-query.personal-copy-success': 'Personal copy saved',
  /** Warning displayed before sharing a query */
  'save-query.share-warning':
    'Shared queries are stored as documents in your dataset and count toward your document quota.',
  /**
   * Save shared query success label
   * @deprecated no longer in use
   */
  // oxlint-disable-next-line no-deprecated -- locale keys are kept for studios on older versions
  'save-query.shared-success': 'Shared query saved',
  /**
   * Save success label
   * @deprecated no longer in use
   */
  // oxlint-disable-next-line no-deprecated -- locale keys are kept for studios on older versions
  'save-query.success': 'Query saved',
  /**
   * Save unshared query success label
   * @deprecated no longer in use
   */
  // oxlint-disable-next-line no-deprecated -- locale keys are kept for studios on older versions
  'save-query.unshared-success': 'Query moved to personal',

  /** Label for the "API version" dropdown in settings */
  'settings.api-version-label': 'API version',
  /** Tooltip shown when the API version selector is locked because a variant is selected */
  'settings.api-version-locked-for-variant':
    'When a variant is selected, the API version needs to be {{apiVersion}}.',
  /**
   * Label for the "Custom API version" input in settings, shown when "other" is chosen as API version
   * @deprecated no longer in use
   */
  // oxlint-disable-next-line no-deprecated -- locale keys are kept for studios on older versions
  'settings.custom-api-version-label': 'Custom API version',
  /** Label for the "Dataset" dropdown in vision settings */
  'settings.dataset-label': 'Dataset',
  /** Error label for when the API version in 'Custom API version' input is invalid */
  'settings.error.invalid-api-version': 'Invalid API version',
  /**
   * Label for the "other" versions within the "API version" dropdown
   * @deprecated no longer in use
   */
  // oxlint-disable-next-line no-deprecated -- locale keys are kept for studios on older versions
  'settings.other-api-version-label': 'Other',
  /**
   * Label for the "Perspective" dropdown in vision settings
   * @see {@link https://www.sanity.io/docs/perspectives}
   */
  'settings.perspective-label': 'Perspective',
  /**
   * Notification about previewDrafts to drafts rename
   * @deprecated no longer in use
   */
  // oxlint-disable-next-line no-deprecated -- locale keys are kept for studios on older versions
  'settings.perspective.preview-drafts-renamed-to-drafts.description':
    'The "<code>previewDrafts</code>" perspective has been renamed to "<code>drafts</code>" and is now deprecated. This change is effective for all versions with perspective support (>= v2021-03-25).',
  /**
   * Call to action to read the docs related to "Perspectives"
   * @deprecated no longer in use
   */
  // oxlint-disable-next-line no-deprecated -- locale keys are kept for studios on older versions
  'settings.perspectives.action.docs-link': 'Read docs',
  /** Option for selecting default perspective */
  'settings.perspectives.default': 'No perspective (API default)',
  /**
   * Description for popover that explains what "Perspectives" are
   * @deprecated no longer in use
   */
  // oxlint-disable-next-line no-deprecated -- locale keys are kept for studios on older versions
  'settings.perspectives.description':
    'Perspectives allow your query to run against different "views" of the content in your dataset',
  /**
   * Description for upcoming default perspective change
   * @deprecated no longer in use
   */
  // oxlint-disable-next-line no-deprecated -- locale keys are kept for studios on older versions
  'settings.perspectives.new-default.description':
    'The default perspective will change from "<code>raw</code>" to "<code>published</code>" in an upcoming API version. Please consult docs for more details.',
  /**
   * Label for the pinned release perspective
   * @deprecated no longer in use
   */
  // oxlint-disable-next-line no-deprecated -- locale keys are kept for studios on older versions
  'settings.perspectives.pinned-release-label': 'Pinned release',
  /** Label for the scheduled drafts perspective */
  'settings.perspectives.scheduled-drafts': 'Scheduled drafts',
  /**
   * Title for popover that explains what "Perspectives" are
   * @deprecated no longer in use
   */
  // oxlint-disable-next-line no-deprecated -- locale keys are kept for studios on older versions
  'settings.perspectives.title': 'Perspectives',

  /** When a tab in the Restore tabs drawer was closed; `date` is the date and time */
  'vision.closed-tabs.closed-at': 'Closed {{date}}',
  /** Menu item deleting a tab from the Restore tabs drawer for good */
  'vision.closed-tabs.delete': 'Delete permanently',
  /** Empty state of the Restore tabs drawer */
  'vision.closed-tabs.empty': 'No closed tabs. Tabs you close are kept here for 30 days.',
  /** Menu item reopening a tab from the Restore tabs drawer */
  'vision.closed-tabs.restore': 'Restore tab',
  /** Copy button of a pane header, for a moment after it copied */
  'vision.copied': 'Copied',
  /** Label of the document after the change in the Delta panel */
  'vision.delta.after': 'After',
  /** Label of the document before the change in the Delta panel */
  'vision.delta.before': 'Before',
  /** What the Delta panel does */
  'vision.delta.description':
    'Runs the query in delta mode, as GROQ-powered webhooks, listeners and Sanity Functions do: before() and after() are a document before and after a change, @ is the document after it, and delta::changedAny() compares them. It runs in the browser with groq-js. An empty side means no document: the change creates or deletes it.',
  /** Label of the document ID field in the Delta panel */
  'vision.delta.document-id': 'Document ID',
  /** Shown when there is a query but no documents to compare */
  'vision.delta.empty': 'Load a document’s history, or write the documents into Before and After.',
  /** Shown when the query fails in delta mode */
  'vision.delta.failed': 'The query could not be run in delta mode: {{message}}',
  /** Shown when the After document is not valid JSON */
  'vision.delta.invalid-after': 'After is not valid JSON: {{message}}',
  /** Shown when the Before document is not valid JSON */
  'vision.delta.invalid-before': 'Before is not valid JSON: {{message}}',
  /** Button loading the document's revisions from the History API */
  'vision.delta.load': 'Load history',
  /** Shown when the history could not be loaded */
  'vision.delta.load-failed': 'The history could not be loaded: {{message}}',
  /** A delta filter that is true for the change */
  'vision.delta.matches': 'Matches: a webhook or function with this filter runs for this change.',
  /** A delta filter that is false for the change */
  'vision.delta.no-match':
    'Does not match: a webhook or function with this filter does not run for this change.',
  /** Shown while the query or its params cannot be sent */
  'vision.delta.no-request': 'Fix the query and its params to run it in delta mode.',
  /** Heading of the delta result */
  'vision.delta.result': 'Result',
  /** A revision in the Before and After lists */
  'vision.delta.revision.option': '{{time}} · {{revision}}',
  /** The After choice for a change that deletes the document */
  'vision.delta.revision.none-after': 'Nothing: the change deletes the document',
  /** The Before choice for a change that creates the document */
  'vision.delta.revision.none-before': 'Nothing: the change creates the document',
  /** Accessible label for the button that closes the sidebar drawer */
  'vision.drawer.close': 'Close panel',
  /** The Copy button in the corner of the query and params editors, for a few seconds after a copy */
  'vision.editor.copied': 'Copied',
  /** Button in the corner of the query and params editors that reformats their text */
  'vision.editor.format': 'Format',
  /** Tooltip and accessible label of the `…` buttons that open a menu of more actions */
  'vision.actions.more': 'More actions',
  /** Toast shown after a code snippet was copied */
  'vision.export-query.copied': 'Snippet copied to clipboard',
  /** Label for the button that copies a code snippet */
  'vision.export-query.copy': 'Copy snippet',
  /** Label for the button that copies every file of a code snippet, each under a comment with its path */
  'vision.export-query.copy-all': 'Copy all files',
  /** Accessible label and tooltip of the icon button in a file's header that copies that file */
  'vision.export-query.copy-file': 'Copy file',
  /** Explanation at the top of the export query dialog */
  'vision.export-query.description':
    'Run this query outside of the studio with one of these snippets.',
  /** Note under the curl snippet when the query is sent as a request body rather than in the URL */
  'vision.export-query.post-body-note':
    'The query and params come to {{size}} characters as search params; from {{limit}} on, @sanity/client sends them as a JSON body rather than in the URL, so the snippet does the same.',
  /** Title of the dialog that exports the query as code snippets */
  'vision.export-query.title': 'Export query',
  /** Note under a snippet that reads an API token, because its perspective includes drafts or releases */
  'vision.export-query.token-env-note':
    'The {{perspective}} perspective returns drafts or release versions, which only an authenticated request can read. Set SANITY_API_TOKEN to a token with read access, on the server only.',
  /** Toast shown after the generated code was copied */
  'vision.export-types.copied': 'Code copied to clipboard',
  /** Label for the button that copies the generated code */
  'vision.export-types.copy': 'Copy code',
  /** Shown in the types dialog when there is neither a schema evaluation nor a result */
  'vision.export-types.empty': 'Fetch the query first so there is a result to derive types from.',
  /** Why the workspace schema could not be used for the types; shown under the result fallback note */
  'vision.export-types.schema-unavailable':
    'The workspace schema could not be used for this query: {{message}}',
  /** Note shown when the types were derived from the fetched result instead of the schema */
  'vision.export-types.source.result':
    'Inferred from the fetched result, since the query could not be evaluated against the workspace schema.',
  /** Note shown when the types were derived from the workspace schema */
  'vision.export-types.source.schema':
    'Inferred from the workspace schema, the same way sanity typegen does it.',
  /** Shown when the schema cannot be evaluated and the shown result belongs to an older query */
  'vision.export-types.stale-result':
    'The result shown was fetched for a different query or params. Fetch the current query first so there is a result to derive types from.',
  /** Title of the dialog exporting TypeScript types for the result */
  'vision.export-types.title-typescript': 'Export TypeScript',
  /** Title of the dialog exporting a Zod schema for the result */
  'vision.export-types.title-zod': 'Export Zod',
  /** Tooltip line of every control that calls Sanity Agent Actions, which bills AI credits */
  'vision.agent-actions.credits': 'Uses one AI credit per request',
  /** Under an Agent Actions control: the organization's AI credits balance this month */
  'vision.ai-credits.balance': '{{balance}} of {{quota}} AI credits left this month.',
  /** Under an Agent Actions control: the credits used beyond the plan's monthly quota */
  'vision.ai-credits.deficit':
    '{{used}} AI credits used this month, {{deficit}} more than the {{quota}} included.',
  /** Under an Agent Actions control: the credits used, on a plan without a quota */
  'vision.ai-credits.used': '{{used}} AI credits used this month.',
  /** Link after the AI credits note, to the organization's AI usage in Manage */
  'vision.ai-credits.usage': 'AI usage',
  /** Title of the card shown where the organization is out of AI credits */
  'vision.ai-credits.limit.title': 'Out of AI credits',
  /** Body of the out-of-credits card, with the credits used and the plan's monthly quota */
  'vision.ai-credits.limit.description':
    'Your organization has used {{used}} of its {{quota}} AI credits this month, so Sanity Agent Actions are paused until next month or until its spending limit is raised.',
  /** Body of the out-of-credits card when the usage and the quota are unknown */
  'vision.ai-credits.limit.description-unknown':
    'Your organization has reached its AI credits spending limit, so Sanity Agent Actions are paused until next month or until the limit is raised.',
  /** Body of the out-of-credits card where a bigger plan comes with more credits */
  'vision.ai-credits.limit.description-upgrade':
    'Your organization has used {{used}} of the {{quota}} AI credits its plan includes this month, so Sanity Agent Actions are paused until next month or until the plan is upgraded.',
  /** Body of the out-of-credits card where a bigger plan comes with more credits, when the usage and the quota are unknown */
  'vision.ai-credits.limit.description-upgrade-unknown':
    'Your organization has used all the AI credits its plan includes this month, so Sanity Agent Actions are paused until next month or until the plan is upgraded.',
  /** Link in the out-of-credits card to the documentation of AI credits */
  'vision.ai-credits.limit.learn-more': 'How AI credits work',
  /** Button in the out-of-credits card leading to the organization's spending limits in Manage */
  'vision.ai-credits.limit.manage': 'Manage AI credits',
  /** Button in the out-of-credits card opening the upsell dialog for a plan with more AI credits */
  'vision.ai-credits.limit.upgrade': 'Upgrade plan',
  /** Button in the request column's action bar naming the API version requests go out with */
  'vision.api-version.button': 'API {{version}}',
  /** The API version button while queries go through the API CDN */
  'vision.api-version.button-cdn': 'API CDN {{version}}',
  /** The API version button while the "Other" API version input holds an unfinished version */
  'vision.api-version.button-invalid': 'Unfinished API version',
  /** Tooltip of the API version button */
  'vision.api-version.tooltip':
    'Queries run against API version {{version}}. Select to change it in Options.',
  /** Tooltip of the API version button while queries go through the API CDN */
  'vision.api-version.tooltip-cdn':
    'Queries run against the API CDN with API version {{version}}. Select to change it in Options.',
  /**
   * Tooltip of the API version button while the API CDN is asked for but the perspective, as the
   * perspective select names it, keeps queries on the API
   */
  'vision.api-version.tooltip-cdn-blocked':
    'Queries run against the API with API version {{version}}, not the API CDN: it does not serve the {{perspective}} perspective. Select to change it in Options.',
  /** Tooltip of the API version button while the "Other" input holds an unfinished version */
  'vision.api-version.tooltip-invalid':
    'The API version in Options is unfinished, so nothing can be fetched until it is complete.',
  /** Tooltip of the API version button while a selected variant forces the variants API version */
  'vision.api-version.tooltip-locked':
    'Queries run against API version {{version}}, which the selected variant needs.',
  /** Button under the query editor that opens the bar changing the query as described */
  'vision.edit.button': 'Edit',
  /** Explanation under the edit query field */
  'vision.edit.description':
    'Sanity Agent Actions change the GROQ as you describe, with the document types, and the Content Lake checks each attempt; every attempt uses one AI credit. It replaces this tab’s query and runs; undo in the editor brings the previous query back.',
  /** Shown when the query could not be changed, above the reason */
  'vision.edit.failed': 'The query could not be changed',
  /** Accessible label of the description field in the edit query bar */
  'vision.edit.label': 'How should the query change?',
  /** Placeholder of the description field in the edit query bar */
  'vision.edit.placeholder': 'Also fetch the author’s name, and only show published posts',
  /** Shown while the first attempt at the changed query is written */
  'vision.edit.progress': 'Changing the query…',
  /** Button changing the query */
  'vision.edit.submit': 'Edit',
  /** Explanation at the top of the Explain panel */
  'vision.explain.description':
    'The query plan is how the Content Lake runs the query: what it reads, filters and sorts while reading, and what is left for later steps. Explain this to me has Sanity Agent Actions describe the query in plain words, say whether it runs well and suggest how to improve it, which uses one AI credit.',
  /** Explanation at the top of the Explain panel when the AI explanation is switched off */
  'vision.explain.description-plan':
    'The query plan is how the Content Lake runs the query: what it reads, filters and sorts while reading, and what is left for later steps.',
  /** Toggle under the explanation showing how the query plan runs the query, step by step */
  'vision.explain.details': 'How it runs, in detail',
  /** Shown in the Explain panel while there is no valid query to explain */
  'vision.explain.empty': 'Write a query to explain it.',
  /** Button in the Explain panel asking Agent Actions to explain the query and its plan */
  'vision.explain.explain': 'Explain this to me',
  /** Shown when the explanation could not be written */
  'vision.explain.failed': 'The query could not be explained: {{message}}',
  /** Button under the explanation's suggestions that has Agent Actions make them to the query */
  'vision.explain.improve': 'Improve query',
  /** Explanation under the Improve query button */
  'vision.explain.improve.description':
    'Sanity Agent Actions make these changes to the GROQ, with the document types, and the Content Lake checks each attempt; every attempt uses one AI credit. It replaces this tab’s query and runs; undo in the editor brings the previous query back.',
  /** Shown when the query could not be improved, above the reason */
  'vision.explain.improve.failed': 'The query could not be improved',
  /** Shown while the first attempt at the improved query is written */
  'vision.explain.improve.progress': 'Improving the query…',
  /** A count the index computes without reading the documents */
  'vision.explain.insight.aggregate': 'Counted in the index, without reading the documents.',
  /** A subquery the plan runs once for all documents */
  'vision.explain.insight.batched-subquery':
    'The subquery runs once for all the documents, in a single batched fetch, not once per document.',
  /** Part of the filter runs in memory; the expression follows */
  'vision.explain.insight.filter-in-memory':
    'Part of the filter runs in memory, after reading: every document the index lets through is read first, which gets slow on large datasets. Joins (->) and functions in a filter cannot use the index.',
  /** The in-memory filter when the verdict is that the query cannot be faster */
  'vision.explain.insight.filter-in-memory.cannot-improve':
    'Part of the filter runs in memory, after the documents are read. That is the work this data takes, and there isn’t a faster way.',
  /** The index sorts and limits while reading */
  'vision.explain.insight.index-sort-limit':
    'The index sorts and limits the documents while reading them.',
  /** The plan slices in memory */
  'vision.explain.insight.slice-in-memory':
    'The slice is taken in memory after reading, not as a limit while reading.',
  /** The in-memory slice when the verdict is that the query cannot be faster */
  'vision.explain.insight.slice-in-memory.cannot-improve':
    'The slice is taken in memory, after reading. That is the work this data takes, and there isn’t a faster way.',
  /** The plan sorts in memory */
  'vision.explain.insight.sort-in-memory':
    'Sorting happens in memory, after reading every match. Sort by attributes the index can sort by.',
  /** The in-memory sort when the verdict is that the query cannot be faster */
  'vision.explain.insight.sort-in-memory.cannot-improve':
    'Sorting happens in memory, after reading every match. That is the work this data takes, and there isn’t a faster way.',
  /** Link under the plan insights to the guide on fast queries */
  'vision.explain.insights.guide': 'High performance GROQ',
  /** Heading of the plan insights in the Explain panel */
  'vision.explain.insights.title': 'What stands out',
  /** Button in the Explain panel fetching the query plan */
  'vision.explain.plan': 'Show the query plan',
  /** Shown when the query plan could not be fetched */
  'vision.explain.plan-failed': 'The query plan could not be fetched: {{message}}',
  /** Heading of the query plan in the Explain panel */
  'vision.explain.plan-title': 'Query plan',
  /** Heading of the explanation's list of changes that would make the query faster */
  'vision.explain.suggestions.title': 'Here are ways you can improve your query',
  /** Verdict of an explanation: the query does slow work, but there is no faster way to get its data */
  'vision.explain.verdict.cannot-improve':
    'This query takes some work, but there isn’t really a faster way to get this data',
  /** Verdict of an explanation: a change to the query would make it faster */
  'vision.explain.verdict.improvable': 'This query can be faster',
  /** Verdict of an explanation: the query runs well as it is */
  'vision.explain.verdict.performant': 'This is a good, fast query',
  /** Button of a library function the query does not declare, which declares it at the top */
  'vision.functions.add': 'Add to query',
  /** Shown on a library function the query declares the same way */
  'vision.functions.declared': 'In this query',
  /** Lint action on a call of a library function the query does not declare */
  'vision.functions.editor.add-from-library': 'Declare it',
  /** Note in a function's hover documentation: the API version it needs */
  'vision.functions.editor.api-version': 'Needs API version {{version}} or later',
  /** Detail of a completion for a custom function the query declares */
  'vision.functions.editor.completion-declared': 'in this query',
  /** Detail of a completion for a library function, which declares it too */
  'vision.functions.editor.completion-library': 'from your library',
  /** Note in the hover documentation of a custom function the query declares */
  'vision.functions.editor.declared-on': 'Custom function, declared on line {{line}}',
  /** Note in the hover documentation of the functions that only work in delta mode */
  'vision.functions.editor.delta-only':
    'Only works in delta mode, where webhooks and Sanity Functions run their filters',
  /** Button over a selected projection in the query editor, turning it into a custom function */
  'vision.functions.editor.extract': 'Extract to function',
  /** Note in the hover documentation of a library function the query does not declare */
  'vision.functions.editor.in-library': 'In your functions library, not declared in this query',
  /** Link at the end of a built-in function's hover documentation */
  'vision.functions.editor.reference': 'GROQ functions reference',
  /** Explanation under the library heading in the Functions panel */
  'vision.functions.library.description':
    'Kept in this browser for every dataset of the project. Completions offer these functions, and lint offers to declare one a query calls.',
  /** Shown in the Functions panel while the library is empty */
  'vision.functions.library.empty':
    'Save a function the query declares to use it in other queries.',
  /** Heading of the functions library in the Functions panel */
  'vision.functions.library.title': 'Library',
  /** Shown in the Functions panel while the query declares no custom functions */
  'vision.functions.query.empty':
    'Declare custom functions at the top of the query, or put the cursor in a projection, like author->{name}, and press the extract button over the editor ({{shortcut}}).',
  /** Heading of the functions the query declares in the Functions panel */
  'vision.functions.query.title': 'In this query',
  /** Removes a function from the library */
  'vision.functions.remove': 'Remove from the library',
  /** Button of a library function the query declares differently, which puts the library's version in */
  'vision.functions.replace': 'Replace in query',
  /** Accessible name of a declared function in the Functions panel, which selects it in the editor */
  'vision.functions.reveal': 'Show {{name}} in the editor',
  /** Button of a function the query declares that is not in the library yet */
  'vision.functions.save': 'Save to library',
  /** Shown on a function the query declares the way the library has it */
  'vision.functions.saved': 'Saved',
  /** Button of a function the query declares differently from the library's version */
  'vision.functions.update': 'Update library',
  /** Button over the query editor that opens the bar writing a query from a description */
  'vision.generate.button': 'Generate',
  /** Closes the generate query bar */
  'vision.generate.close': 'Close',
  /** Explanation under the generate query field */
  'vision.generate.description':
    'Sanity Agent Actions write the GROQ from your description and the document types, and the Content Lake checks each attempt; every attempt uses one AI credit. It replaces this tab’s query and runs; undo in the editor brings the previous query back.',
  /** Shown when no query could be generated, above the reason */
  'vision.generate.failed': 'The query could not be generated',
  /** Accessible label of the description field in the generate query bar */
  'vision.generate.label': 'What should the query fetch?',
  /** Opens the last rejected attempt, without running it, to fix it by hand */
  'vision.generate.open-anyway': 'Open the last attempt',
  /** Placeholder of the description field in the generate query bar */
  'vision.generate.placeholder':
    'The 10 most recent authors, ordered by last name and then first name',
  /** Shown while the first attempt at a query is written */
  'vision.generate.progress': 'Writing the query…',
  /** Shown while a rejected attempt is retried */
  'vision.generate.progress-retry': 'Fixing the query (attempt {{attempt}} of {{max}})…',
  /** Button generating the query */
  'vision.generate.submit': 'Generate',
  /** Heading of the explanation summary an AI improvement of the query followed, in the history */
  'vision.history.ai.explanation': 'Explanation',
  /** In a history entry, what the AI was asked when it fitted the query to the document list */
  'vision.history.ai.fit-document-list':
    'Asked to change the query so the Documents view can list its result',
  /** Heading of the lint findings Fix with AI was asked to fix, in the history */
  'vision.history.ai.lint-findings': 'Lint findings',
  /** Where a lint finding Fix with AI was asked to fix is, in the history */
  'vision.history.ai.lint-location': 'Line {{line}}, column {{column}}',
  /** Heading of the description the user wrote for Generate query or Edit with AI, in the history */
  'vision.history.ai.prompt': 'Prompt',
  /** Heading of the explanation's suggestions an AI improvement made, in the history */
  'vision.history.ai.suggestions': 'Suggestions',
  /** A history entry whose result differs from the previous result, which is no longer kept */
  'vision.history.changed': 'Changed',
  /** Badge on a history entry the API CDN answered */
  'vision.history.cdn': 'API CDN',
  /** Badge on a history entry the API CDN answered from its cache */
  'vision.history.cdn-cache-hit': 'CDN cache hit',
  /**
   * Toggle on a history entry that shows how its request and result differ from the previous
   * successful fetch
   */
  'vision.history.changes': 'Changes',
  /** Shown instead of the changes when they could not be loaded or rendered */
  'vision.history.changes-failed': 'The changes could not be shown.',
  /** Button retrying to show the changes of a history entry */
  'vision.history.changes-retry': 'Retry',
  /** Above the changes of a history entry: the fetch they are compared with */
  'vision.history.compared-with': 'Compared with the fetch at {{time}}',
  /**
   * Label of the diff of the GROQ query in the changes of a history entry an AI action wrote: the
   * query the action started from, and the one it wrote
   */
  'vision.history.diff.ai-query': 'Query before and after AI',
  /** Label of the diff of the GROQ params in a history entry's changes */
  'vision.history.diff.params': 'Params',
  /** Label of the diff of the GROQ query in a history entry's changes */
  'vision.history.diff.query': 'Query',
  /** Instead of the query diff, when the two queries only differ in whitespace and line breaks */
  'vision.history.diff.query-formatting-only': 'Only the formatting changed',
  /** Label of the diff of the query result in a history entry's changes */
  'vision.history.diff.result': 'Result',
  /**
   * Label of the diff of the request URL in a history entry's changes: the API host, version and
   * dataset, and options such as the perspective
   */
  'vision.history.diff.url': 'Request URL',
  /** Empty state of the history panel */
  'vision.history.empty': 'Nothing fetched yet',
  /** Status label for a failed fetch in the history */
  'vision.history.failed': 'Failed',
  /** Button putting the hidden fields back into the diff out of a history entry's changes */
  'vision.history.hide-hidden': 'Hide them',
  /** Next to a history entry's changes: the fields the diff leaves out */
  'vision.history.hiding': 'Hiding {{fields}}',
  /** A history entry whose result only differs from the previous one in hidden fields */
  'vision.history.only-hidden-changed': 'Only hidden fields changed',
  /** History reason: a tab opened with a generated query fetched it */
  'vision.history.reason.generated': 'Generated query',
  /** History reason: Edit with AI changed the tab's query as the user described, and ran it */
  'vision.history.reason.ai.edit': 'Edited with AI',
  /** History reason: Fix with AI in the Lint panel fixed the query's lint findings, and ran it */
  'vision.history.reason.ai.fix-lint': 'Lint issues fixed with AI',
  /** History reason: AI rewrote the query so its result lists documents, and ran it */
  'vision.history.reason.ai.fit-document-list': 'Updated for the document list with AI',
  /** History reason: Generate query wrote a query from the user's description, and ran it */
  'vision.history.reason.ai.generate': 'Generated with AI',
  /** History reason: Improve query made the explanation's suggestions to the query, and ran it */
  'vision.history.reason.ai.improve': 'Improved with AI from the explanation',
  /** History reason: a link to the tool named a query URL, which opened in a tab and ran */
  'vision.history.reason.link': 'Opened link',
  /** History reason: a live event matched the query's sync tags */
  'vision.history.reason.live': 'Live update',
  /** History reason: the live connection asked every client to refetch */
  'vision.history.reason.live-restart': 'Live connection restarted',
  /** History reason: a saved query was loaded into a tab that refetches automatically */
  'vision.history.reason.load': 'Query loaded',
  /** History reason: the fetch button was pressed */
  'vision.history.reason.manual': 'Fetch button',
  /** History reason: dataset, API version or perspective changed while refetching automatically */
  'vision.history.reason.options': 'Options changed',
  /** History reason: a query URL was pasted into the tab, which runs it */
  'vision.history.reason.paste': 'Pasted URL',
  /** History reason: a tab that refetches automatically was opened again, or the studio reloaded */
  'vision.history.reason.resume': 'Automatic refetching resumed',
  /** History reason: the keyboard shortcut was used */
  'vision.history.reason.shortcut': 'Keyboard shortcut',
  /** A history entry whose result is the same as the previous result, for a changed request */
  'vision.history.same-result': 'Same result',
  /** Button showing the hidden fields in a history entry's changes */
  'vision.history.show-hidden': 'Show them',
  /** Next to a history entry's changes while the hidden fields are shown */
  'vision.history.showing-hidden': 'Showing {{fields}}, hidden by default',
  /** A history entry whose result, or the previous one, is too large to compare */
  'vision.history.too-large': 'Too large to compare',
  /** A history entry whose result is the same as the previous result */
  'vision.history.unchanged': 'No changes',
  /** Shown in the Lint panel while the query has no lint findings */
  'vision.lint.empty':
    'No lint findings. Problems the GROQ linter spots in the query are listed here as you type; pick one to select it in the editor.',
  /** Button in the Lint panel that fixes the listed problems with Agent Actions */
  'vision.lint.fix': 'Fix with AI',
  /** Shown when the lint problems could not be fixed, above the reason */
  'vision.lint.fix.failed': 'The problems could not be fixed',
  /** Opens the last rejected fix, without running it, to finish by hand */
  'vision.lint.fix.open-anyway': 'Open the last attempt',
  /** Shown while the fixed query is written */
  'vision.lint.fix.progress': 'Fixing the query…',
  /** Button in the Lint panel when every listed problem has a suggestion, which it writes in place without Agent Actions */
  'vision.lint.fix.suggestions': 'Apply suggestions',
  /** Where a lint finding sits in the query, shown under its message */
  'vision.lint.position': 'Line {{line}}, column {{column}}',
  /** Where a lint finding caused by a param's value is: the param, and the item in it (`type`, `types[1]`) */
  'vision.lint.position-param': 'Params · {{param}}',
  /** Severity badge of a lint finding */
  'vision.lint.severity.error': 'Error',
  /** Severity badge of a lint finding */
  'vision.lint.severity.hint': 'Hint',
  /** Severity badge of a lint finding */
  'vision.lint.severity.info': 'Info',
  /** Severity badge of a lint finding */
  'vision.lint.severity.warning': 'Warning',
  /** Lint action writing the type, field or operator a schema finding suggests */
  'vision.lint.use-suggestion': 'Use {{suggestion}}',
  /** Completion detail of a document type name without a title, in `_type == "…"` */
  'vision.schema.editor.document-type': 'Document type',
  /** Under a field's type in its completion info and hover: the schema types that declare it */
  'vision.schema.editor.field-of': 'Field of {{types}}',
  /** Link at the end of an operator's hover documentation in the query editor */
  'vision.schema.editor.operator-reference': 'GROQ operators reference',
  /** Under a param's type in its hover, when the params give it no value yet */
  'vision.schema.editor.param-not-set':
    'No value in the params yet; expected from how the query uses it',
  /** Under a param's type in its hover: the type is its value in the params */
  'vision.schema.editor.param-value': 'Its value in the params',
  /** Completion detail of the fields every document or reference has (`_id`, `_ref`) */
  'vision.schema.editor.system-field': 'System field',
  /** Title the browser shows for the WebMCP tool that lints a query */
  'vision.webmcp.check-query': 'Check a GROQ query in Vision',
  /** Title the browser shows for the WebMCP tool that describes the workspace schema */
  'vision.webmcp.describe-schema': 'Describe the schema in Vision',
  /** Title the browser shows for the WebMCP tool that returns a query plan */
  'vision.webmcp.explain-query': 'Explain a GROQ query in Vision',
  /** Title the browser shows for the WebMCP tool that reads the active Vision tab */
  'vision.webmcp.get-state': 'Read the open Vision tab',
  /** Title the browser shows for the WebMCP tool that opens a query in a new tab */
  'vision.webmcp.open-query': 'Open a GROQ query in Vision',
  /** Title the browser shows for the WebMCP tool that runs mutations as a dry run */
  'vision.webmcp.preview-mutations': 'Preview mutations in Vision',
  /** Title the browser shows for the WebMCP tool that runs a query */
  'vision.webmcp.run-query': 'Run a GROQ query in Vision',
  /** Button in the request column's action bar that refetches automatically */
  'vision.live.button': 'Live fetch',
  /** Tooltip of the Live button while automatic refetching is off */
  'vision.live.button.start': 'Fetch again whenever the documents in the result change',
  /** Tooltip of the Stop live button, while the tab refetches automatically */
  'vision.live.button.stop':
    'Stop fetching when the documents in the result change. Fetch still fetches on demand, for results no document change touches, like now()',
  /** Error shown when the live connection breaks */
  'vision.live.error': 'Live updates disconnected: {{message}}',
  /** The Live fetch button while the tab refetches automatically, stopping it */
  'vision.live.stop': 'Stop live',
  /** Button in the Mutate panel adding a mutation to the list */
  'vision.mutate.add': 'Add mutation',
  /** Adds a mutation creating a document, with the type of the result's first document */
  'vision.mutate.add.create': 'Create a document',
  /** Adds a mutation deleting a document, its ID to fill in */
  'vision.mutate.add.delete': 'Delete a document',
  /** Adds a mutation deleting the documents of the shown result */
  'vision.mutate.add.delete-result': 'Delete the documents in the result',
  /** Adds a mutation patching a document, its ID to fill in */
  'vision.mutate.add.patch': 'Patch a document',
  /** Adds a mutation patching the documents of the shown result */
  'vision.mutate.add.patch-result': 'Patch the documents in the result',
  /** Button applying the mutations a dry run showed */
  'vision.mutate.apply': 'Apply to {{dataset}}',
  /** Heading of the error shown when applying the mutations failed */
  'vision.mutate.apply-failed': 'The mutations were not applied',
  /** Next to Apply while the mutations as they are have had no dry run */
  'vision.mutate.apply-needs-preview': 'Apply sends what a dry run showed: run one first.',
  /** Shown once the mutations were applied */
  'vision.mutate.applied':
    'Applied to {{dataset}} in transaction {{transactionId}}. Documents changed: {{count}}.',
  /** Option giving array items without a _key one */
  'vision.mutate.auto-keys': 'Add a _key to array items that have none',
  /** Under the option giving array items a _key */
  'vision.mutate.auto-keys.description': 'The studio needs one on every array item to edit it.',
  /** Button showing a document's changes in the dry run */
  'vision.mutate.changes': 'Changes',
  /** Shown instead of a document's changes when they could not be loaded or rendered */
  'vision.mutate.changes-failed': 'The changes could not be shown.',
  /** Button retrying to show a document's changes */
  'vision.mutate.changes-retry': 'Retry',
  /** What the Mutate panel does */
  'vision.mutate.description':
    'Write mutations as the Mutations API takes them, in a list: create, createOrReplace, createIfNotExists, delete and patch, by ID or by a GROQ query. A dry run shows what they would do to each document without changing anything; Apply then writes them to the dataset in one transaction, with your account.',
  /** What the API says went wrong with one of the mutations */
  'vision.mutate.failure-item': 'Mutation {{index}}: {{message}}',
  /** Tooltip and accessible label of the button opening the generate mutations field */
  'vision.mutate.generate.button': 'Generate mutations',
  /** Explanation under the generate mutations field */
  'vision.mutate.generate.description':
    'Sanity Agent Actions write the mutations from your description, the documents in the result and their types, and a dry run checks each attempt; every attempt uses one AI credit. They replace the mutations here, where undo brings these back; nothing is written until you apply them.',
  /** Shown when no mutations could be generated, above the reason */
  'vision.mutate.generate.failed': 'The mutations could not be generated',
  /** Accessible label of the description field in the generate mutations bar */
  'vision.mutate.generate.label': 'What should the mutations do?',
  /** Placeholder of the description field in the generate mutations bar */
  'vision.mutate.generate.placeholder': 'Change the title of the documents in the result to foobar',
  /** Shown while the first attempt at the mutations is written */
  'vision.mutate.generate.progress': 'Writing the mutations…',
  /** Shown while an attempt the dry run turned down is retried */
  'vision.mutate.generate.progress-retry': 'Fixing the mutations (attempt {{attempt}} of {{max}})…',
  /** Under the dry run: the fields the diffs leave out */
  'vision.mutate.hiding': 'The changes leave out {{fields}}, as History does.',
  /** Shown when the mutations are not valid JSON */
  'vision.mutate.invalid-json': 'The mutations are not valid JSON: {{message}}',
  /** Shown when a mutation does not name exactly one thing to do */
  'vision.mutate.invalid-mutation':
    'Mutation {{index}} needs exactly one of create, createOrReplace, createIfNotExists, delete or patch.',
  /** Label of the mutations editor */
  'vision.mutate.mutations': 'Mutations',
  /** The dry run touched no documents */
  'vision.mutate.no-documents': 'The mutations touch no documents.',
  /** Shown when the JSON is not a list of mutations */
  'vision.mutate.not-a-list':
    'Write a list of mutations, a single mutation, or a request body with a list of mutations.',
  /** Under the dry run when it touched more documents than it compares */
  'vision.mutate.not-shown': 'Documents also touched, not compared here: {{count}}',
  /** A document the mutations create */
  'vision.mutate.operation.create': 'Create',
  /** A document the mutations delete */
  'vision.mutate.operation.delete': 'Delete',
  /** A document the mutations touch without changing its content */
  'vision.mutate.operation.none': 'No change',
  /** A document the mutations change */
  'vision.mutate.operation.update': 'Update',
  /** Button running the mutations as a dry run */
  'vision.mutate.preview': 'Dry run',
  /** Heading of the error shown when the dry run failed */
  'vision.mutate.preview-failed': 'The dry run failed',
  /** Heading of the dry run's outcome */
  'vision.mutate.preview-heading': 'Dry run',
  /** Shown over a dry run made for other mutations, another dataset or other options */
  'vision.mutate.stale':
    'The mutations, the dataset or the options changed after this dry run. Run it again to apply them.',
  /** How many documents the dry run changes and leaves as they are */
  'vision.mutate.summary': 'Changed: {{changed}} · Unchanged: {{unchanged}}',
  /** In the Response panel: whether a cache answered the query */
  'vision.network.cache': 'Cache',
  /** The API CDN answered from its cache */
  'vision.network.cache.hit': 'Hit',
  /** Under the details of a CDN cache hit */
  'vision.network.cache.hit-explained':
    'The CDN answered with a response it had cached, from a location near you; the query did not reach the API.',
  /** The API CDN answered with a response this session had not seen */
  'vision.network.cache.miss': 'Miss, as far as this session can tell',
  /** The API answered, which caches nothing */
  'vision.network.cache.none': 'None, the API answers every request with fresh content',
  /** In the Response panel: the endpoint that answered */
  'vision.network.endpoint': 'Answered by',
  /** The live API answered */
  'vision.network.endpoint.api': 'API',
  /** The API CDN answered */
  'vision.network.endpoint.cdn': 'API CDN',
  /** In the Response panel: the HTTP method the query was sent with */
  'vision.network.method': 'Method',
  /** The query and its params went in the URL */
  'vision.network.method.get': 'GET, with the query and params in the URL',
  /** The query and its params went in the request body */
  'vision.network.method.post': 'POST, with the query and params as a JSON body',
  /** Under the method of a POST request: why the query was not sent in the URL */
  'vision.network.method.post-explained':
    'The query and params come to {{size}} characters as search params; from {{limit}} on, @sanity/client sends them as a JSON body, since the API limits the length of a URL. The options stay in the URL.',
  /** In the Response panel: the region the query ran in */
  'vision.network.region': 'Query ran in',
  /** The response did not say where the query ran */
  'vision.network.region.unknown': 'Not reported',
  /** In the Response panel: the round trip and the time on the server */
  'vision.network.timing': 'Time',
  /** In the Response panel: the trace of the request, for Sanity support */
  'vision.network.trace': 'Trace ID',
  /** Tooltip next to the endpoint in the Response panel while queries go to the API */
  'vision.network.use-cdn-hint':
    'Turn on Use the API CDN in Options to send queries through the CDN.',
  /** Names the info button that shows how to send queries through the API CDN */
  'vision.network.use-cdn-hint.label': 'About the API CDN',
  /** Label of the browser's marker on the Response panel's globe, placed from its time zone */
  'vision.network.you': 'You',
  /** Heading of the API version list's dated versions, below its Today option */
  'vision.options.api-version.dated': 'Dated versions',
  /** Under the first option of the API version list, which is today's date */
  'vision.options.api-version.today': 'Today',
  /** Under the API version content variants need, in the API version list */
  'vision.options.api-version.variants': 'Required for variants',
  /** Under vX in the API version list */
  'vision.options.api-version.experimental': 'Experimental',
  /** Under v1 in the API version list */
  'vision.options.api-version.legacy': 'Legacy, not recommended',
  /** The first and default option of the dataset, perspective and variant menus, which follows the workspace and navbar */
  'vision.options.auto': 'Auto',
  /** What a picker's button shows while Auto is selected; the name is what Auto resolves to */
  'vision.options.auto.button': 'Auto ({{name}})',
  /** Under the dataset menu's Auto option: the workspace's dataset, which it follows */
  'vision.options.dataset.auto.subtitle': 'Workspace dataset: {{dataset}}',
  /** Shown in the dataset menu when the search matches no dataset */
  'vision.options.dataset.no-matches': 'No datasets match',
  /** Placeholder of the search field at the top of the dataset menu */
  'vision.options.dataset.search-placeholder': 'Search datasets',
  /** Heading of the dataset menu's datasets no workspace of this project uses */
  'vision.options.dataset.other-datasets': 'Other datasets',
  /** Heading of the dataset menu's datasets the other workspaces of this project use */
  'vision.options.dataset.workspace-datasets': 'Workspace datasets',
  /** Label for the "Include content source map" switch */
  'vision.options.include-source-map': 'Include content source map',
  /** Description for the "Include content source map" switch, in its info tooltip */
  'vision.options.include-source-map.description':
    'Adds resultSourceMap to the response, shown in the Content Source Map tab.',
  /** Label of the Options field that holds the API CDN switch */
  'vision.options.caching-label': 'Caching',
  /** Label of the switch that sends queries to the API CDN */
  'vision.options.use-cdn': 'Use the API CDN',
  /** Note in the API CDN switch's info tooltip while the studio signs in with a cookie */
  'vision.options.use-cdn.anonymous':
    'This studio signs you in with a cookie, which the API CDN never receives: it answers as it would an anonymous visitor, with what a public dataset shows.',
  /**
   * Why the API CDN is asked for but not used: the perspective is the one the perspective
   * select shows, such as "Global (drafts)"
   */
  'vision.options.use-cdn.blocked':
    'The API CDN does not serve drafts or releases, so queries with the {{perspective}} perspective go to the API. With published or raw they use the CDN.',
  /** Heading of the notice shown while the perspective keeps queries off the API CDN */
  'vision.options.use-cdn.blocked.title': 'Queries go to the API, not the CDN',
  /** Description of the API CDN switch, in its info tooltip */
  'vision.options.use-cdn.description':
    'Sends the query to the API CDN, like useCdn: true in @sanity/client, with the published and raw perspectives: drafts and releases always go to the API. Its answers are cached for up to a minute; the Response panel shows when one came from the cache.',
  /** The short line under the API CDN switch; the rest is in its tooltip */
  'vision.options.use-cdn.summary': 'Cached responses, for published and raw',
  /** Button in the API CDN notice switching the tab to the published perspective */
  'vision.options.use-cdn.use-published': 'Use the published perspective',
  /** Under the perspective menu's Auto option; the name is the navbar's perspective */
  'vision.options.perspective.auto.subtitle': 'Follows the studio: {{name}}',
  /** Under the perspective menu's API default option while the API version does not parse */
  'vision.options.perspective.default.subtitle': 'Whatever the API version defaults to',
  /**
   * Under the perspective menu's API default option: the perspective the API applies to a query
   * without one, for the selected API version
   */
  'vision.options.perspective.default.subtitle-for-version':
    'Defaults to {{perspective}} on API version {{apiVersion}}',
  /** Heading of the perspective menu's group of perspectives only Vision offers */
  'vision.options.perspective.more': 'More perspectives',
  /** Shown in the perspective menu when the search matches no perspective */
  'vision.options.perspective.no-matches': 'No perspectives match',
  /** Under the perspective menu's raw option */
  'vision.options.perspective.raw.subtitle':
    'Every document as stored, drafts and versions included',
  /** Placeholder of the search field at the top of the perspective menu */
  'vision.options.perspective.search-placeholder': 'Search perspectives',
  /** Under the variant menu's Auto option; the name is the navbar's variant */
  'vision.options.variant.auto.subtitle': 'Follows the studio: {{name}}',
  /** Under the variant menu's Auto option while the navbar has no variant selected */
  'vision.options.variant.auto.subtitle-none': 'Follows the studio, which has none selected',
  /** Under the variant menu's None option */
  'vision.options.variant.none.subtitle': 'Queries without a variant',
  /** Variant option sending no variant */
  'vision.options.variant.none': 'None',
  /** Label of the variant field */
  'vision.options.variant-label': 'Variant',
  /**
   * Accessible name of the chip in the request column's action bar while the tab queries another
   * dataset than the workspace; the chip shows a database icon and the dataset name
   */
  'vision.overrides.dataset.button': 'Dataset {{dataset}}',
  /** Tooltip of the dataset override chip */
  'vision.overrides.dataset.tooltip':
    'Dataset {{dataset}} differs from the workspace dataset {{workspaceDataset}}. Select to change it in Options.',
  /**
   * Accessible name of the chip in the request column's action bar while the tab's perspective
   * differs from the navbar's; the chip shows the perspective menu's icon and the perspective name
   */
  'vision.overrides.perspective.button': 'Perspective {{perspective}}',
  /** Tooltip of the perspective override chip; both names as the perspective select shows them */
  'vision.overrides.perspective.tooltip':
    'Perspective {{perspective}} differs from the global perspective {{globalPerspective}}. Select to change it in Options.',
  /** Chip in the request column's action bar while the tab sends no variant but the navbar has one */
  'vision.overrides.variant.button': 'No variant',
  /** Tooltip of the variant override chip */
  'vision.overrides.variant.tooltip':
    'Queries send no variant, which differs from the global variant {{variant}}. Select to change it in Options.',
  /** Accessible label for collapsing a bottom panel */
  'vision.panel.collapse': 'Collapse panel',
  /** Accessible label for expanding a bottom panel */
  'vision.panel.expand': 'Expand panel',
  /** Label of the "Explain" tab in the response panel: the query plan and an explanation */
  'vision.panel.explain': 'Explain',
  /** Label of the Functions tab in the request panel */
  'vision.panel.functions': 'Functions',
  /** Label of the Delta tab in the response panel, which tests the query in delta mode */
  'vision.panel.delta': 'Delta',
  /** Label of the Mutate tab in the response panel, which runs and applies mutations */
  'vision.panel.mutate': 'Mutate',
  /** Label of the "History" tab in the response panel */
  'vision.panel.history': 'History',
  /** Label of the "Lint" tab in the request panel, listing the query's lint findings */
  'vision.panel.lint': 'Lint',
  /** Label of the Lint tab when the query has findings. `count` is how many */
  'vision.panel.lint-count': 'Lint ({{count}})',
  /** Label of the "Options" panel in the request column */
  'vision.panel.options': 'Options',
  /** Label of the "Response" tab in the response panel */
  'vision.panel.response': 'Response',
  /** Label of the "Content Source Map" tab in the response panel */
  'vision.panel.source-map': 'Content Source Map',
  /** Button adding an item to a list param in the params form */
  'vision.params-form.add-item': 'Add item',
  /**
   * Shown under a list param in the Form view when it has more items than the form renders.
   * Switch to the JSON view to edit the rest.
   */
  'vision.params-form.list-truncated':
    'Showing the first {{shown}} of {{count}} items. Switch to JSON to edit the rest.',
  /** Placeholder of a params form field that takes any JSON value */
  'vision.params-form.any-placeholder': 'Any JSON value; other text is sent as a string',
  /** Accessible label of the button setting a param the query treats as optional to null */
  'vision.params-form.clear': 'Set ${{name}} to null',
  /** Accessible label of the info icon showing a params form field's type and usages */
  'vision.params-form.details': 'About ${{name}}',
  /** Shown in the params form when the query uses no params */
  'vision.params-form.empty': 'The query uses no params. Each $name in it gets a field here.',
  /** Shown in the params form while the params JSON cannot be parsed */
  'vision.params-form.invalid-json':
    'The params are not valid JSON. Fix them in the JSON view to edit them here.',
  /** A boolean param's value is not true or false; it is sent anyway */
  'vision.params-form.invalid.boolean': 'Not true or false; sent as {{value}}',
  /** A document type param's value is not a document type of the workspace; it is sent anyway */
  'vision.params-form.invalid.document-type': 'Not a document type in this workspace; sent anyway',
  /** A whole number param (a slice bound, a count, a field of whole numbers) holds a fraction */
  'vision.params-form.invalid.integer': 'Not a whole number; sent anyway',
  /** A list param's value is not a list; it is sent anyway */
  'vision.params-form.invalid.list': 'Not a list; sent as {{value}}',
  /** A number param's value is above the largest value the query or the schema takes */
  'vision.params-form.invalid.max': 'More than {{max}}; sent anyway',
  /** A number param's value is below the smallest value the query or the schema takes */
  'vision.params-form.invalid.min': 'Less than {{min}}; sent anyway',
  /** A number param's value is not a number; it is sent anyway */
  'vision.params-form.invalid.number': 'Not a number; sent as text',
  /** A param's value is not one of the values the schema allows; it is sent anyway */
  'vision.params-form.invalid.option': 'Not one of the known values; sent anyway',
  /** A text param's value is not text; it is sent anyway */
  'vision.params-form.invalid.string': 'Not text; sent as {{value}}',
  /** Accessible label of an item input of a list param in the params form */
  'vision.params-form.item-label': '${{name}}, item {{index}}',
  /** Placeholder of an item input of a list param in the params form */
  'vision.params-form.item-placeholder': 'Item',
  /** Shown in the params form when the workspace schema could not be read */
  'vision.params-form.no-schema':
    'Types come from the query alone: the workspace schema could not be read.',
  /** Placeholder of a params form field without a value, and the state of an unset boolean */
  'vision.params-form.not-set': 'Not set',
  /** Placeholder of a params form field whose param is null; typing sends text instead */
  'vision.params-form.null': 'null',
  /** Accessible label of the preview of an object param, which opens a dialog to edit its keys */
  'vision.params-form.object.edit': 'Edit {{name}}',
  /** In the dialog of an object param whose keys are neither read by the query nor set */
  'vision.params-form.object.empty':
    'The query reads no keys of this param. Use the params JSON to add some.',
  /** Button removing a param the query does not use from the params */
  'vision.params-form.remove': 'Remove',
  /** Button removing every param the query does not use from the params */
  'vision.params-form.remove-all': 'Remove all',
  /** Accessible label of the button removing an item from a list param */
  'vision.params-form.remove-item': 'Remove item',
  /** Tooltip of the alert icon of a params form field whose param has no value */
  'vision.params-form.required': 'The query fails until this param has a value',
  /** Shown in the params form when the query does not parse */
  'vision.params-form.syntax-error':
    'The query does not parse, so its params are listed without types.',
  /** Type hint of a params form field: any JSON value */
  'vision.params-form.type.any': 'any JSON value',
  /** Type hint of a params form field: true or false */
  'vision.params-form.type.boolean': 'true or false',
  /** Type hint of a params form field: an ISO 8601 date and time */
  'vision.params-form.type.datetime': 'date and time (ISO 8601)',
  /** Type hint of a params form field: a document ID */
  'vision.params-form.type.document-id': 'document ID',
  /** Type hint of a params form field: one of the workspace's document types */
  'vision.params-form.type.document-type': 'document type',
  /** Type hint of a params form field: a whole number */
  'vision.params-form.type.integer': 'whole number',
  /** Type hint of a params form field: a list of values */
  'vision.params-form.type.list': 'list, each {{type}}',
  /** Type hint of a params form field: a number with a largest value */
  'vision.params-form.type.max': '{{type}}, at most {{max}}',
  /** Type hint of a params form field: a number with a smallest value */
  'vision.params-form.type.min': '{{type}}, at least {{min}}',
  /** Type hint of a params form field: a number */
  'vision.params-form.type.number': 'number',
  /** Type hint of a params form field: an object whose keys the query reads */
  'vision.params-form.type.object': 'object',
  /** Type hint of a params form field: one of the values the schema allows */
  'vision.params-form.type.options': '{{type}}, one of {{count}} values',
  /** Type hint of a params form field: a number between a smallest and a largest value */
  'vision.params-form.type.range': '{{type}}, from {{min}} to {{max}}',
  /** Type hint of a params form field: text */
  'vision.params-form.type.string': 'text',
  /** In the details tooltip of a params form field: the type of value the query expects */
  'vision.params-form.type-detail': 'type: {{type}}',
  /** Accessible label of the info icon by the unused params heading, about where types come from */
  'vision.params-form.types-details': 'About the param types',
  /** Heading of the params the query does not use, listed in the params form */
  'vision.params-form.unused': 'Not used by the query',
  /** Before the expressions that use a param, in the params form */
  'vision.params-form.used-in': 'Used in',
  /** Accessible label of the `…` menu next to the params view tabs */
  'vision.params.actions': 'Params actions',
  /** Accessible label of the button next to the params view tabs that copies the params */
  'vision.params.copy': 'Copy params',
  /** Shown in the params export dialog when the workspace schema could not be read */
  'vision.params.export.source-no-schema':
    'Inferred from how the query uses each param. The workspace schema could not be read, so params compared with fields are typed only as far as the query tells.',
  /** Note at the top of the dialog exporting types for the params */
  'vision.params.export.source':
    'Inferred from how the query uses each param, against the workspace schema, the same way the params form types them.',
  /** Caution in the params export dialog when the query does not parse */
  'vision.params.export.syntax-error':
    'The query does not parse, so its params are typed as unknown until it does.',
  /** Title of the dialog exporting TypeScript types for the params */
  'vision.params.export.title-typescript': 'Export params as TypeScript',
  /** Title of the dialog exporting a Zod schema for the params */
  'vision.params.export.title-zod': 'Export params as Zod',
  /** Menu item in the params `…` menu exporting TypeScript types for the params */
  'vision.params.export-typescript': 'Export TypeScript…',
  /** Tooltip of the params export menu items when the query uses no params */
  'vision.params.export-unavailable': 'The query uses no params to export types for',
  /** Menu item in the params `…` menu exporting a Zod schema for the params */
  'vision.params.export-zod': 'Export Zod…',
  /** Accessible label of the button next to the params view menu that reformats the params JSON */
  'vision.params.format': 'Format params',
  /** Accessible label of the params view dropdown, with the view it shows such as JSON */
  'vision.params.view.button': 'Edit params as: {{view}}',
  /** Menu item editing the params as a form inferred from the query */
  'vision.params.view.form': 'Form',
  /** Menu item editing the params as JSON */
  'vision.params.view.json': 'JSON',
  /** Accessible label of the menu switching how the params are edited */
  'vision.params.view.label': 'Edit params as',
  /** Toast shown after a query URL was pasted and loaded into the tab */
  'vision.paste.parsed': 'Loaded query from pasted URL',
  /** Toast shown after a curl command for a query was pasted and loaded into the tab */
  'vision.paste.parsed-curl': 'Loaded query from pasted cURL command',
  /** Toast shown when a pasted URL used a content variant the tab does not send */
  'vision.paste.unavailable-variant':
    'The pasted URL used the "{{variant}}" variant; select it in the navbar to run the query with it.',
  /** Toast shown when the dataset of a pasted URL is not available here */
  'vision.paste.unknown-dataset':
    'The dataset "{{dataset}}" in the pasted URL is not available here, keeping the current one.',
  /** Toast shown when the perspective of a pasted URL cannot be used */
  'vision.paste.unsupported-perspective':
    'The perspective in the pasted URL is not supported here, keeping the current one.',
  /** Toast shown when a pasted URL used a content variant, but this workspace has variants switched off */
  'vision.paste.variants-disabled':
    'The pasted URL used the "{{variant}}" variant; this workspace has variants switched off, so the query runs without it.',
  /** Accessible label for the query actions menu */
  'vision.query.actions': 'Query actions',
  /** Tooltip when automatic refetching is not available for the API version */
  'vision.query.auto-refetch.unsupported':
    'Refetching automatically needs API version v2021-03-25 or later.',
  /** Accessible label of the button in the query editor's corner that copies the query */
  'vision.query.copy': 'Copy query',
  /** Menu item opening the export query dialog */
  'vision.query.export': 'Export query…',
  /** Accessible label of the button in the query editor's corner that reformats the query */
  'vision.query.format': 'Format query',
  /** Toast shown when the query could not be reformatted */
  'vision.query.prettify.failed': 'Could not format the query',
  /** The Fetch button while a fetch is running, stopping it; paired with Stop live */
  'vision.query.stop': 'Stop',
  /** Tooltip and accessible label of the Stop button, which stops the running fetch only */
  'vision.query.stop.description': 'Stop fetching',
  /**
   * Button next to Fetch in the classic tool that switches to the redesigned one
   * @deprecated no longer in use
   */
  // oxlint-disable-next-line no-deprecated -- locale keys are kept for studios on older versions
  'vision.redesign.try': 'Try the redesign',
  /**
   * Tooltip of the button next to Fetch in the classic tool that switches to the redesign
   * @deprecated no longer in use
   */
  // oxlint-disable-next-line no-deprecated -- locale keys are kept for studios on older versions
  'vision.redesign.try.description':
    'Switch to the redesigned Vision, in beta. You can switch back at any time from its sidebar.',
  /** Empty state of the response panel before anything was fetched */
  'vision.response.empty': 'Nothing fetched yet',
  /** Label for the payload size in the response tab */
  'vision.response.payload-size': 'Payload size',
  /** Label for the sync tags in the response tab */
  'vision.response.sync-tags': 'Sync tags',
  /** Shown when the response carried no sync tags */
  'vision.response.sync-tags.none': 'No sync tags in the response',
  /** Under the sync tags when some of them stand for nothing the lookup could find */
  'vision.response.sync-tags.partly-resolved':
    '{{count}} of {{total}} sync tags could not be resolved and are shown as they came.',
  /** Under the sync tags when looking up what they stand for failed */
  'vision.response.sync-tags.resolve-failed': 'Could not resolve the sync tags: {{message}}',
  /** Under the sync tags while the lookup of what they stand for is running */
  'vision.response.sync-tags.resolving': 'Resolving sync tags…',
  /** Tooltip of the Sync tags label while it shows what the tags stand for */
  'vision.response.sync-tags.show-raw': 'Show the sync tags as they came',
  /** Tooltip of the Sync tags label while it shows the tags as they came */
  'vision.response.sync-tags.show-resolved': 'Show what the sync tags stand for',
  /** Tooltip of a sync tag the lookup could not resolve */
  'vision.response.sync-tags.unresolved':
    'Not resolved: no type, slug, document or dataset the query compares or reads answered with this tag within the lookup’s {{budget}} probes.',
  /** Tooltip of the sync tag that stands for the whole dataset, the `*` or `ALL` tag */
  'vision.response.sync-tags.wildcard':
    'This tag covers the whole dataset. With Sanity Live or live fetch, any change in the dataset triggers a refetch.',
  /** Tooltip of a sync tag that stands for the whole of another dataset, read through a cross-dataset reference */
  'vision.response.sync-tags.other-dataset':
    'This tag covers the whole of the dataset “{{dataset}}”, read through a cross-dataset reference. With Sanity Live or live fetch, any change in that dataset triggers a refetch.',
  /** Under the query URL when the request went out as a POST body rather than that URL */
  'vision.response.url.sent-as-post':
    'Sent as a POST body: the query and params are too long for a URL, so @sanity/client sent them as JSON. Pasting this URL into Vision still loads the query.',
  /** Toast shown after the whole result was copied from the result tree or graph */
  'vision.result.copied': 'Result copied to clipboard',
  /** Toast shown after a value in the result was copied, with its path such as [0].author.name */
  'vision.result.copied-value': 'Copied {{path}}',
  /**
   * Button in the result's action bar copying the result as JSON
   * @deprecated no longer in use
   */
  // oxlint-disable-next-line no-deprecated -- locale keys are kept for studios on older versions
  'vision.result.copy': 'Copy result',
  /** Button next to each property in the result tree, copying its value */
  'vision.result.copy-value': 'Copy value',
  /** Button on a row of the document list copying the document's ID */
  'vision.result.documents.copy-id': 'Copy ID',
  /** Toast confirming the document list copied a document's ID */
  'vision.result.documents.copied-id': 'Copied {{id}}',
  /** Empty state of a document list whose result lists no documents */
  'vision.result.documents.empty': 'The result lists no documents',
  /** Button in the document list that has Agent Actions change the query for the list to show it */
  'vision.result.documents.fit': 'Update query with AI',
  /** Shown beside the button over a list whose rows lack attributes the list shows, which it names */
  'vision.result.documents.fit.description':
    'These rows have no {{fields}}. Agent Actions can add them to the query, keeping its filter and comments; every attempt uses one AI credit.',
  /** Shown under the expected shape when the result is not a document list */
  'vision.result.documents.fit.description-invalid':
    'Agent Actions can change the query to list documents, keeping its filter and comments; every attempt uses one AI credit.',
  /** Shown when the query could not be changed for the document list, above the reason */
  'vision.result.documents.fit.failed': 'The query could not be updated',
  /** Shown while the first attempt at the query for the document list is written */
  'vision.result.documents.fit.progress': 'Updating the query for the list…',
  /** Shown when the result is not an array, so Documents cannot list it */
  'vision.result.documents.invalid.not-array':
    'This result is not an array, so Documents cannot list it. _id is required. _type, title, subtitle and media are optional. Expected shape:',
  /** Shown when some items of the result have no _id, with how many and how many items there are */
  'vision.result.documents.invalid.missing-id':
    '{{count}} of {{total}} items have no _id, so Documents cannot list them. _id is required. _type, title, subtitle and media are optional. Expected shape:',
  /** Button on a row of the document list opening the document in a new browser tab */
  'vision.result.documents.open-new-tab': 'Open in new tab',
  /** Tooltip and accessible label of the button after an `_id` or `_ref` in the result tree, opening that document */
  'vision.result.edit-document': 'Edit document',
  /** Empty state of the result view */
  'vision.result.empty': 'Run the query to see its result here',
  /** Menu item saving the result as a CSV file */
  'vision.result.export-csv': 'Save as CSV…',
  /** Button on a graph node hiding the objects and arrays it holds */
  'vision.result.graph.collapse': 'Hide what it holds',
  /** Button on a collapsed graph node showing the objects and arrays it holds again */
  'vision.result.graph.expand': 'Show the {{count}} objects and arrays it holds',
  /** Button fitting the whole graph in view */
  'vision.result.graph.fit': 'Fit to view',
  /** Accessible label of the graph, saying how to move around in it */
  'vision.result.graph.label':
    'Result graph: drag to move, scroll to zoom; while focused, the arrow keys move, + and - zoom, 0 fits',
  /** The last row of a graph node with more entries than it lists */
  'vision.result.graph.more': '… {{count}} more',
  /** Title of the graph node of the result itself */
  'vision.result.graph.root': 'result',
  /** Ends the note on a graph that leaves part of this result out */
  'vision.result.graph.left-out-hint': 'The tree and JSON views show all of it.',
  /** Note on a graph of a result with more objects and arrays than it draws */
  'vision.result.graph.node-limit': 'Only the first {{nodes}} objects and arrays are drawn.',
  /**
   * Note on a graph whose objects or arrays have more entries than it lists; the nodes are the
   * ones in this result, each with its number of entries
   */
  'vision.result.graph.partial': 'Only the first {{rows}} entries are listed for {{nodes}}.',
  /** After the objects and arrays the note names, how many more list only their first entries */
  'vision.result.graph.partial.more': 'and {{count}} more',
  /** An object or array in the note, with how many entries it has (always more than listed) */
  'vision.result.graph.partial.node': '{{name}} ({{entries}} entries)',
  /** Button zooming into the graph */
  'vision.result.graph.zoom-in': 'Zoom in',
  /** Button zooming out of the graph */
  'vision.result.graph.zoom-out': 'Zoom out',
  /** Menu item saving the result as a JSON file */
  'vision.result.export-json': 'Save as JSON…',
  /** Menu item opening the TypeScript export dialog */
  'vision.result.export-typescript': 'Export TypeScript…',
  /** Menu item opening the Zod export dialog */
  'vision.result.export-zod': 'Export Zod…',
  /** Tooltip and accessible label of the result header's menu of export and save options */
  'vision.result.more-actions': 'More actions',
  /** Accessible label of the result view dropdown, with the view it shows such as JSON */
  'vision.result.view.button': 'Result view: {{view}}',
  /** View listing a result shaped `*[]{_id, _type, title?, subtitle?, media?}` as document previews */
  'vision.result.view.documents': 'Documents',
  /** View showing the result as a graph of its objects and arrays */
  'vision.result.view.graph': 'Graph',
  /** View showing the result as indented JSON text, to select and copy from */
  'vision.result.view.json': 'JSON',
  /** Accessible label of the menu that switches how the result shows */
  'vision.result.view.label': 'Result view',
  /** View showing the result as a tree to browse */
  'vision.result.view.tree': 'Tree',
  /** Empty state of the Shared tabs and Restore tabs drawers when the search matches nothing */
  'vision.saved.empty-search': 'No tabs match your search',
  /** Menu item loading a shared tab into the active tab */
  'vision.saved.load-in-current-tab': 'Load into current tab',
  /** Menu item opening a shared tab in a new tab */
  'vision.saved.open-in-new-tab': 'Open in new tab',
  /** Toast shown when saved queries were opened as tabs, which happens once in each browser */
  'vision.saved.opened-as-tabs': 'Saved queries opened as tabs: {{count}}',
  /** Menu item renaming a shared tab */
  'vision.saved.rename': 'Rename',
  /** Toast shown when an opened shared tab used a content variant the tab does not send */
  'vision.saved.unavailable-variant':
    'This shared tab used the "{{variant}}" variant; select it in the navbar to run the query with it.',
  /** Toast shown when an opened shared tab names a dataset that is not available here */
  'vision.saved.unknown-dataset':
    'The dataset "{{dataset}}" of this shared tab is not available here, keeping the current one.',
  /** Toast shown when an opened shared tab used a content variant, but this workspace has variants switched off */
  'vision.saved.variants-disabled':
    'This shared tab used the "{{variant}}" variant; this workspace has variants switched off, so the query runs without it.',
  /** Explains the settings that switch Vision's AI features off */
  'vision.settings.ai.description':
    "These features write with Sanity Agent Actions and use your organization's AI credits. Switch off the ones you do not want; the choice is saved in this browser.",
  /** Switch in the settings that turns every AI feature on or off */
  'vision.settings.ai.enabled': 'Use AI features',
  /** Switch in the settings for editing queries with Agent Actions */
  'vision.settings.ai.edit-query': 'Edit queries',
  /** Description of the switch for editing queries with Agent Actions */
  'vision.settings.ai.edit-query.description': 'Edit changes the query as you describe.',
  /** Switch in the settings for fixing lint problems with Agent Actions */
  'vision.settings.ai.fix-lint': 'Fix lint problems',
  /** Description of the switch for fixing lint problems with Agent Actions */
  'vision.settings.ai.fix-lint.description':
    'Fix with AI in the Lint panel fixes the problems the linter found.',
  /** Switch in the settings for explaining queries with Agent Actions */
  'vision.settings.ai.explain-query': 'Explain queries',
  /** Description of the switch for explaining queries with Agent Actions */
  'vision.settings.ai.explain-query.description':
    'Explain this to me in the Explain panel. The query plan stays available.',
  /** Switch in the settings for generating mutations with Agent Actions */
  'vision.settings.ai.generate-mutations': 'Generate mutations',
  /** Description of the switch for generating mutations with Agent Actions */
  'vision.settings.ai.generate-mutations.description':
    'Generate in the Mutate panel writes mutations from a description.',
  /** Switch in the settings for generating queries with Agent Actions */
  'vision.settings.ai.generate-query': 'Generate queries',
  /** Description of the switch for generating queries with Agent Actions */
  'vision.settings.ai.generate-query.description': 'Generate writes the query from a description.',
  /** Title of the settings that switch Vision's AI features off */
  'vision.settings.ai.title': 'AI features',
  /** Button in the settings dialog that clears the stored state */
  'vision.settings.clear-storage': 'Clear storage',
  /** Confirmation button for clearing the storage */
  'vision.settings.clear-storage.confirm': 'Yes, clear storage',
  /** Explanation of what clearing the storage does */
  'vision.settings.clear-storage.description':
    'Deletes the functions library and the closed tabs, and resets the open tabs and these defaults in this browser. Shared tabs are kept.',
  /** Toast shown after the storage was cleared */
  'vision.settings.clear-storage.success': 'Storage cleared',
  /** Explanation at the top of the settings dialog */
  'vision.settings.description': 'Defaults for new tabs. Open tabs keep their own options.',
  /** Switch in the settings that reformats a prettified query when the query editor is resized */
  'vision.settings.editor.auto-format-on-resize': 'Auto-format GROQ on resize',
  /** Description of the switch that reformats a prettified query when the query editor is resized */
  'vision.settings.editor.auto-format-on-resize.description':
    'When the query editor gets wider or narrower, a query laid out by Prettify is laid out again for the new width. Queries you formatted yourself are left as they are.',
  /** Title of the settings section about the query editor */
  'vision.settings.editor.title': 'Query editor',
  /** Explains the settings that pick the snippets of the Export query dialog and their order */
  'vision.settings.export-snippets.description':
    'The snippets the Export query dialog offers, as its tabs in this order. Switch off the ones you do not use; the choice is saved in this browser.',
  /** Accessible label of the button that moves an export snippet one tab later */
  'vision.settings.export-snippets.move-down': 'Move {{snippet}} down',
  /** Accessible label of the button that moves an export snippet one tab earlier */
  'vision.settings.export-snippets.move-up': 'Move {{snippet}} up',
  /** Button that shows every export snippet again, in the default order */
  'vision.settings.export-snippets.reset': 'Reset to defaults',
  /** Title of the settings that pick the snippets of the Export query dialog */
  'vision.settings.export-snippets.title': 'Export snippets',
  /** Explains the setting listing the fields left out of History diffs */
  'vision.settings.history-diff.description':
    'One field path per line. A path matches at any depth of a result, so _rev hides the revision of every document in it. Each diff can still show them.',
  /** Button restoring the default fields left out of History diffs */
  'vision.settings.history-diff.reset': 'Reset to the defaults',
  /** Label of the setting listing the fields left out of History diffs */
  'vision.settings.history-diff.title': 'Fields hidden from History diffs',
  /** Switch in the settings that lets the Sync tags row show what each tag stands for */
  'vision.settings.response.resolve-sync-tags': 'Resolve sync tags',
  /** Description of the switch that lets the Sync tags row show what each tag stands for */
  'vision.settings.response.resolve-sync-tags.description':
    'Show the documents each sync tag in the Response panel stands for: every document, a type, an id or a slug. Click Sync tags to switch to the tags as they came. Finding the documents sends a few extra queries to the dataset the response came from.',
  /** Title of the settings section about the Response panel */
  'vision.settings.response.title': 'Response panel',
  /** Switch in the settings that turns the Content Source Map features on */
  'vision.settings.source-map.enabled': 'Content Source Map features',
  /** Description of the switch in the settings that turns the Content Source Map features on */
  'vision.settings.source-map.enabled.description':
    'Shows the "Include content source map" option and the Content Source Map tab. While off, queries and Export query snippets never ask for a source map.',
  /** Label of the setting picking the `resultSourceMap` value queries send */
  'vision.settings.source-map.format': 'Source map format',
  /** Option of the content source map format setting: `resultSourceMap: true` */
  'vision.settings.source-map.format.default': 'Standard (true)',
  /** Description of the setting picking the `resultSourceMap` value queries send */
  'vision.settings.source-map.format.description':
    'The resultSourceMap value sent whenever a query asks for a source map: with "Include content source map" on, from Fetch source map, and in the Export query snippets.',
  /** Option of the content source map format setting: `resultSourceMap: 'withKeyArraySelector'` */
  'vision.settings.source-map.format.with-key-array-selector':
    'Array items by _key (withKeyArraySelector)',
  /** Title of the settings section about Content Source Maps */
  'vision.settings.source-map.title': 'Content Source Map',
  /** Title of the settings dialog */
  'vision.settings.title': 'Settings',
  /** Empty state of the shared tabs panel */
  'vision.shared.empty':
    'No shared tabs yet. To share one with everyone using this dataset, use Share tab in the More actions menu above its query.',
  /** Shortcut description: close dialogs and menus */
  'vision.shortcuts.close': 'Close dialogs and menus',
  /** Shortcut description: close the query tab that is showing */
  'vision.shortcuts.close-tab': 'Close the current tab',
  /** Shortcut that lists the functions matching the name being typed in the query editor */
  'vision.shortcuts.complete': 'Complete a function name',
  /** Shortcut description: copy the query, or the params while they have focus */
  'vision.shortcuts.copy-query': 'Copy the query, or the params while they have focus',
  /** Shortcut that turns the selected projection, or the one around the cursor, into a custom function */
  'vision.shortcuts.extract-function': 'Extract the projection at the cursor to a function',
  /** Shortcut description: run the query */
  'vision.shortcuts.fetch': 'Fetch the query',
  /** Shortcut description: open a new query tab */
  'vision.shortcuts.new-tab': 'Open a new tab',
  /** Shortcut description: move the cursor to the next lint finding in the query editor */
  'vision.shortcuts.next-finding': 'Jump to the next lint finding',
  /** Shortcut description: show the query tab after the current one, the first after the last */
  'vision.shortcuts.next-tab': 'Go to the next tab',
  /** Shortcut description: reformat the query, or the params JSON while it has focus */
  'vision.shortcuts.prettify': 'Format the query, or the params JSON while it has focus',
  /** Shortcut description: show the query tab before the current one, the last before the first */
  'vision.shortcuts.previous-tab': 'Go to the previous tab',
  /**
   * Note under the tab shortcuts in the keyboard shortcuts dialog. Browsers keep VS Code's keys
   * for their own tabs, except in an app window, which has none; `keys` lists them, eg "⌘+N, ⌘+W"
   */
  'vision.shortcuts.tabs-app-window':
    'VS Code’s own keys for tabs work in an installed app window too: {{keys}}',
  /** Title of the keyboard shortcuts dialog */
  'vision.shortcuts.title': 'Keyboard shortcuts',
  /** Sidebar toggle: show icons only */
  'vision.sidebar.collapse': 'Collapse sidebar',
  /** Sidebar toggle: show labels next to the icons */
  'vision.sidebar.expand': 'Expand sidebar',
  /** Sidebar item and drawer title for the tabs closed in the last 30 days, which can be reopened */
  'vision.sidebar.closed-tabs': 'Restore tabs',
  /** Accessible label for the sidebar navigation */
  'vision.sidebar.label': 'Vision sidebar',
  /** Sidebar item opening the settings dialog */
  'vision.sidebar.settings': 'Settings',
  /** Sidebar item and drawer title for shared tabs, the tabs stored as shared queries */
  'vision.sidebar.shared-queries': 'Shared tabs',
  /** Sidebar item opening the keyboard shortcuts dialog */
  'vision.sidebar.shortcuts': 'Keyboard shortcuts',
  /** Empty state of the content source map panel */
  'vision.source-map.empty': 'This response has no content source map.',
  /** Empty state of the content source map panel after "Fetch source map" came back without one */
  'vision.source-map.empty-after-fetch': 'The query came back without a content source map.',
  /** Button in the content source map panel that runs the query once with a source map */
  'vision.source-map.fetch': 'Fetch source map',
  /** Explains the "Fetch source map" button */
  'vision.source-map.fetch.description':
    'Runs the query once with a source map, just for this tab. The result and your options stay as they are.',
  /** Shown when "Fetch source map" failed; `message` is the error */
  'vision.source-map.fetch.error': 'Could not fetch the source map: {{message}}',
  /** Explains the "Include content source map" option, next to the button that shows it */
  'vision.source-map.include-hint':
    'To get a source map with every fetch, turn on "Include content source map" in Options. The Export query snippets then ask for one too.',
  /** Beside the content source map's view menu, when the map came from "Fetch source map" */
  'vision.source-map.one-off': 'Fetched once, until the next fetch',
  /** Button in the content source map panel that opens Options on "Include content source map" */
  'vision.source-map.show-option': 'Show option',
  /** Accessible label of the divider between the result and the response details panel */
  'vision.split.bottom-panel':
    'Resize the response details panel: drag or use the arrow keys; Home and End go to the bounds, Enter resets',
  /** Accessible label of the divider between the request and response panes */
  'vision.split.request-response':
    'Resize the request and response panes: drag or use the arrow keys; Home and End go to the bounds, Enter resets',
  /** Toast shown when the tab being shared is the same query as one already shared */
  'vision.tabs.already-shared': 'This tab is already shared',
  /** Accessible label for the button closing a query tab */
  'vision.tabs.close-tab': 'Close tab',
  /** Accessible label for the list of query tabs */
  'vision.tabs.label': 'Query tabs',
  /** Accessible label for the button opening a new query tab */
  'vision.tabs.new-tab': 'New tab',
  /**
   * Menu item sharing a tab with everyone using the dataset, or sharing a shared tab again after
   * it changed, and the title of the dialog confirming a first share
   */
  'vision.tabs.share': 'Share tab',
  /** Toast shown when sharing a tab failed */
  'vision.tabs.share-failed': 'Could not share the tab',
  /** Toast shown when a tab was shared */
  'vision.tabs.share-success': 'Tab shared',
  /** Toast shown when a shared tab was shared again, replacing what was shared */
  'vision.tabs.share-update-success': 'Shared tab updated',
  /** Accessible label of the icon marking a tab the user shared */
  'vision.tabs.shared': 'Shared tab',
  /** Placeholder of the input renaming a tab */
  'vision.tabs.title-placeholder': 'Tab title',
  /** Menu item that stops sharing a tab: the tab stays open, only for the user who shared it */
  'vision.tabs.unshare': 'Unshare tab',
  /** Toast shown when unsharing a tab failed */
  'vision.tabs.unshare-failed': 'Could not unshare the tab',
  /** Toast shown when a tab was unshared */
  'vision.tabs.unshare-success': 'Tab unshared',
  /** Title of a tab whose query is still empty */
  'vision.tabs.untitled': 'Untitled query',
} as const)

/**
 * @alpha
 */
export type VisionLocaleResourceKeys = keyof typeof visionLocaleStrings

export default visionLocaleStrings
