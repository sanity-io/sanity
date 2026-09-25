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
  /** Empty state of the history panel */
  'vista.history.empty': 'Nothing fetched yet',
  /** Status label for a failed fetch in the history */
  'vista.history.failed': 'Failed',
  /** History reason: a live event matched the query's sync tags */
  'vista.history.reason.live': 'Live update',
  /** History reason: the live connection asked every client to refetch */
  'vista.history.reason.live-restart': 'Live connection restarted',
  /** History reason: a saved or pasted query was loaded into a tab that refetches automatically */
  'vista.history.reason.load': 'Query loaded',
  /** History reason: the fetch button was pressed */
  'vista.history.reason.manual': 'Fetch button',
  /** History reason: dataset, API version or perspective changed while refetching automatically */
  'vista.history.reason.options': 'Options changed',
  /** History reason: the keyboard shortcut was used */
  'vista.history.reason.shortcut': 'Keyboard shortcut',
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
  /** Badge shown while a tab refetches automatically */
  'vista.live.active': 'Live',
  /** Error shown when the live connection breaks */
  'vista.live.error': 'Live updates disconnected: {{message}}',
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
  /** Value announced for the params resize handle while the panel sizes itself to its content */
  'vista.params.fit-height': 'Sized to the content, {{height}} pixels',
  /** Accessible label and tooltip of the handle for resizing the params panel */
  'vista.params.resize':
    'Resize params: drag or use the arrow keys; double-click or press Enter to fit the content again',
  /** Toast shown after a query URL was pasted and loaded into the tab */
  'vista.paste.parsed': 'Loaded query from pasted URL',
  /** Toast shown when the perspective of a pasted URL cannot be used */
  'vista.paste.unsupported-perspective':
    'The perspective in the pasted URL is not supported here, keeping the current one.',
  /** Accessible label for the query actions menu */
  'vista.query.actions': 'Query actions',
  /** Menu item toggling automatic refetching through sync tags */
  'vista.query.auto-refetch': 'Refetch automatically',
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
  /** Accessible label for the button that stops a running fetch */
  'vista.query.stop': 'Stop fetching',
  /** Explanation in the settings section about the redesigned experience */
  'vista.redesign.settings.description':
    'You are using the redesigned Vision tool. Switching back keeps your tabs and settings in this browser for the next time you try it.',
  /** Title of the settings section about the redesigned experience */
  'vista.redesign.settings.title': 'Redesigned Vision (beta)',
  /** Sidebar item and settings button that return to the classic Vision tool */
  'vista.redesign.switch-to-classic': 'Switch to classic Vision',
  /** Toast button that switches to the redesigned tool */
  'vista.redesign.toast.accept': 'Try it now',
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
  /** Menu item copying the result as JSON */
  'vista.result.copy': 'Copy result',
  /** Empty state of the result view */
  'vista.result.empty': 'Run the query to see its result here',
  /** Button exporting the result as CSV */
  'vista.result.export-csv': 'Export CSV',
  /** Button exporting the result as JSON */
  'vista.result.export-json': 'Export JSON',
  /** Menu item opening the TypeScript export dialog */
  'vista.result.export-typescript': 'Export TypeScript…',
  /** Menu item opening the Zod export dialog */
  'vista.result.export-zod': 'Export Zod…',
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
  /** Button in the settings dialog that clears the stored state */
  'vista.settings.clear-storage': 'Clear storage',
  /** Confirmation button for clearing the storage */
  'vista.settings.clear-storage.confirm': 'Yes, clear storage',
  /** Explanation of what clearing the storage does */
  'vista.settings.clear-storage.description':
    'Deletes your personal saved queries, resets the open tabs and these defaults in this browser, and returns to the classic Vision tool. Shared queries are kept.',
  /** Toast shown when the saved queries could not be cleared */
  'vista.settings.clear-storage.error': 'Could not clear the saved queries',
  /** Toast shown after the storage was cleared */
  'vista.settings.clear-storage.success': 'Storage cleared',
  /** Explanation at the top of the settings dialog */
  'vista.settings.description': 'Defaults for new tabs. Open tabs keep their own options.',
  /** Title of the settings dialog */
  'vista.settings.title': 'Settings',
  /** Empty state of the shared queries panel */
  'vista.shared.empty':
    'No shared queries yet. Share a saved query to make it available to everyone using this dataset.',
  /** Shortcut description: close dialogs and menus */
  'vista.shortcuts.close': 'Close dialogs and menus',
  /** Shortcut description: copy the query */
  'vista.shortcuts.copy-query': 'Copy the query',
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
