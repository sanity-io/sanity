import {defineEvent} from '@sanity/telemetry'

/**
 * Usage events for the Vision tool. Payloads are coarse enums, counts and booleans only: never
 * query text, parameter names or values, results, document IDs or contents, dataset, project,
 * perspective or release names, prompts, titles, or anything else a user typed or fetched.
 *
 * The shared section covers what both the classic tool and the redesign can do, and is kept
 * byte for byte the same on every release line that ships Vision, so usage compares across
 * them. It imports nothing, so it can be copied as it is. Events only the redesign can fire
 * follow in their own section.
 */

/* -------------------------------------------------------------------------------------------
 * Shared: classic and redesign
 * ------------------------------------------------------------------------------------------- */

/** Which Vision UI fired an event that both of them can fire */
export type VisionUi = 'classic' | 'redesign'

export type VisionQueryMode = 'fetch' | 'listen'
export type VisionQueryTrigger = 'button' | 'shortcut'

export interface VisionQueryRunData {
  mode: VisionQueryMode
  trigger: VisionQueryTrigger
  /** True when the run sent at least one parameter. Values and names are not recorded. */
  hasParams: boolean
}

/** The tool mounted. Fires once per visit to the tool, not on every render. */
export const VisionOpened = defineEvent<{ui: VisionUi}>({
  name: 'Vision Opened',
  version: 1,
  description: 'User opened the Vision tool. ui is the classic tool or the redesign.',
})

/** User ran the current query. A dataset, perspective, or API version change does not count. */
export const VisionQueryRun = defineEvent<VisionQueryRunData>({
  name: 'Vision Query Run',
  version: 1,
  description:
    'User ran a GROQ query in Vision, with Fetch or Listen. ' +
    'hasParams records whether the run included parameters; the query and the parameters are not recorded.',
})

/** The run included parameters. Fires with Vision Query Run, and only then. */
export const VisionParamsUsed = defineEvent<{mode: VisionQueryMode}>({
  name: 'Vision Params Used',
  version: 1,
  description:
    'User ran a Vision query that included parameters. Parameter names and values are not recorded.',
})

/** User stopped a fetch before it answered, or stopped listening */
export const VisionQueryCancelled = defineEvent<{mode: VisionQueryMode}>({
  name: 'Vision Query Cancelled',
  version: 1,
  description: 'User cancelled a running Vision fetch, or stopped a Vision listener.',
})

export const VisionDatasetChanged = defineEvent({
  name: 'Vision Dataset Changed',
  version: 1,
  description:
    'User changed the dataset a Vision query runs against. The dataset name is not recorded.',
})

export const VisionPerspectiveChanged = defineEvent({
  name: 'Vision Perspective Changed',
  version: 1,
  description:
    'User changed the perspective a Vision query runs against. The perspective is not recorded.',
})

export const VisionApiVersionChanged = defineEvent<{custom: boolean}>({
  name: 'Vision API Version Changed',
  version: 1,
  description:
    'User changed the API version a Vision query runs against. ' +
    'custom is true when they typed a version rather than picking a listed one. The version is not recorded.',
})

/**
 * - `query`, `params`: the editor's contents
 * - `url`: the request URL of the query
 * - `result`: a value, or the whole result, from the result viewer
 */
export type VisionCopyTarget = 'query' | 'params' | 'url' | 'result'

export const VisionCopied = defineEvent<{target: VisionCopyTarget}>({
  name: 'Vision Copied',
  version: 1,
  description:
    'User copied the Vision query, its params, its request URL, or a value from its result. ' +
    'The copied text is not recorded.',
})

/** A query URL pasted into Vision loaded the query, its params and its options */
export const VisionQueryUrlPasted = defineEvent({
  name: 'Vision Query URL Pasted',
  version: 1,
  description: 'User pasted a query URL into Vision, which loaded it. The URL is not recorded.',
})

/**
 * - `save`: saved the current query as a new personal query
 * - `load`: loaded a saved query into the editor (the current tab, in the redesign)
 * - `open-in-new-tab`: opened a saved query in a new tab (redesign)
 * - `update`: overwrote a saved query with the current query
 * - `rename`, `share`, `unshare`, `delete`: as named
 */
export type VisionSavedQueryAction =
  | 'save'
  | 'load'
  | 'open-in-new-tab'
  | 'update'
  | 'rename'
  | 'share'
  | 'unshare'
  | 'delete'

export const VisionSavedQueryUsed = defineEvent<{
  action: VisionSavedQueryAction
  /** Whether the query acted on is in the shared list. False for `save`. */
  shared: boolean
}>({
  name: 'Vision Saved Query Used',
  version: 1,
  description:
    'User saved, loaded, updated, renamed, shared, unshared or deleted a saved Vision query. ' +
    'The query and its title are not recorded.',
})

/**
 * - `all`, `personal`, `shared`: picked which saved queries the list shows
 * - `search`: started filtering the list by text (once per search, not per keystroke)
 */
export type VisionSavedQueriesFilter = 'all' | 'personal' | 'shared' | 'search'

export const VisionSavedQueriesFiltered = defineEvent<{filter: VisionSavedQueriesFilter}>({
  name: 'Vision Saved Queries Filtered',
  version: 1,
  description:
    'User filtered the list of saved Vision queries, by owner or by text. The search text is not recorded.',
})

/** `json`, `csv`: the result as a file. `typescript`, `zod`: types inferred from it (redesign). */
export type VisionResultExportFormat = 'json' | 'csv' | 'typescript' | 'zod'

export const VisionResultExported = defineEvent<{format: VisionResultExportFormat}>({
  name: 'Vision Result Exported',
  version: 1,
  description:
    'User downloaded a Vision result, or types inferred from it. The result is not recorded.',
})

/**
 * Where the document was opened from: a document ID in the result viewer, or a row of the
 * redesign's Documents view
 */
export type VisionDocumentOpenSource = 'result' | 'document-list'

export const VisionDocumentOpened = defineEvent<{source: VisionDocumentOpenSource}>({
  name: 'Vision Document Opened',
  version: 1,
  description:
    'User opened a document from a Vision result in the studio. The document is not recorded.',
})

/**
 * - `saved-queries`: the classic tool's saved queries pane
 * - `sidebar`: the redesign's sidebar
 * - `request`: the redesign's tabbed panel below the query editor
 * - `response`: the redesign's tabbed panel below the result
 */
export type VisionPanel = 'saved-queries' | 'sidebar' | 'request' | 'response'

export const VisionPanelToggled = defineEvent<{panel: VisionPanel; open: boolean}>({
  name: 'Vision Panel Toggled',
  version: 1,
  description: 'User opened or collapsed a Vision panel.',
})

/* -------------------------------------------------------------------------------------------
 * Redesign only
 *
 * The redesign is the only Vision tool from v7 on. These events cover what only it can do.
 * ------------------------------------------------------------------------------------------- */

export const VisionTabsChanged = defineEvent<{count: number; action: 'open' | 'add' | 'close'}>({
  name: 'Vision Tabs Changed',
  version: 1,
  description:
    'How many query tabs Vision has open. ' +
    'open is the count when the tool mounts; add and close are later changes. Tab titles are not recorded.',
})

/** What the user did to a query tab, other than opening or closing it */
export type VisionTabAction = 'select' | 'rename' | 'reorder'

export const VisionTabUsed = defineEvent<{action: VisionTabAction}>({
  name: 'Vision Tab Used',
  version: 1,
  description:
    'User switched to, renamed or reordered a Vision query tab. Titles are not recorded.',
})

/** The sidebar's drawers */
export type VisionDrawerId = 'saved' | 'shared' | 'delta' | 'mutate' | 'settings'

export const VisionDrawerOpened = defineEvent<{drawer: VisionDrawerId}>({
  name: 'Vision Drawer Opened',
  version: 1,
  description: 'User opened a drawer from the Vision sidebar.',
})

/**
 * - `shortcuts`: the keyboard shortcuts dialog
 * - `export-query`: the export query dialog with its code snippets
 * - `export-result-types`, `export-params-types`: types inferred from the result or the params
 */
export type VisionDialogId =
  | 'shortcuts'
  | 'export-query'
  | 'export-result-types'
  | 'export-params-types'

export const VisionDialogOpened = defineEvent<{dialog: VisionDialogId}>({
  name: 'Vision Dialog Opened',
  version: 1,
  description: 'User opened a Vision dialog.',
})

/**
 * The tabs of the redesign's two panels: `params`, `options`, `lint` and `functions` below the
 * query editor, `response`, `history`, `explain` and `source-map` below the result
 */
export type VisionPanelTab =
  | 'params'
  | 'options'
  | 'lint'
  | 'functions'
  | 'response'
  | 'history'
  | 'explain'
  | 'source-map'

export const VisionPanelTabOpened = defineEvent<{tab: VisionPanelTab}>({
  name: 'Vision Panel Tab Opened',
  version: 1,
  description: 'User opened a tab of one of the Vision panels.',
})

/**
 * - `result`: how the result shows (`json`, `tree`, `graph`, `documents`)
 * - `source-map`: how the content source map shows (`json`, `tree`, `graph`)
 * - `params`: how the params are edited (`json`, `form`)
 */
export type VisionViewTarget = 'result' | 'source-map' | 'params'
export type VisionView = 'json' | 'tree' | 'graph' | 'documents' | 'form'

export const VisionViewChanged = defineEvent<{target: VisionViewTarget; view: VisionView}>({
  name: 'Vision View Changed',
  version: 1,
  description: 'User changed how Vision shows its result, its content source map, or its params.',
})

/**
 * Per-tab request options that switch on and off. The dataset, perspective and API version have
 * events of their own, and Live is Vision Query Run and Vision Query Cancelled in `listen` mode.
 * - `variant`: send the navbar's variant
 * - `source-map`: include a content source map
 * - `cdn`: query the API CDN
 */
export type VisionToggleOption = 'variant' | 'source-map' | 'cdn'

export const VisionOptionToggled = defineEvent<{option: VisionToggleOption; enabled: boolean}>({
  name: 'Vision Option Toggled',
  version: 1,
  description: 'User switched a Vision request option on or off.',
})

/**
 * The settings group the user changed
 * - `defaults`: options for new tabs
 * - `history-diff`, `ai`, `editor`, `response`, `export-snippets`: as named
 * - `storage-cleared`: reset Vision, clearing its stored tabs and settings
 */
export type VisionSettingsSection =
  | 'defaults'
  | 'history-diff'
  | 'ai'
  | 'editor'
  | 'response'
  | 'export-snippets'
  | 'storage-cleared'

export const VisionSettingsChanged = defineEvent<{section: VisionSettingsSection}>({
  name: 'Vision Settings Changed',
  version: 1,
  description: 'User changed a Vision setting. The new value is not recorded.',
})

/**
 * Keyboard shortcuts. Running the query by shortcut is also Vision Query Run with
 * trigger `shortcut`.
 */
export type VisionShortcut = 'fetch' | 'prettify' | 'copy-query' | 'extract-function'

export const VisionShortcutUsed = defineEvent<{shortcut: VisionShortcut}>({
  name: 'Vision Shortcut Used',
  version: 1,
  description: 'User used a Vision keyboard shortcut.',
})

export const VisionQueryPrettified = defineEvent<{outcome: 'success' | 'error'}>({
  name: 'Vision Query Prettified',
  version: 1,
  description:
    'User prettified the Vision query. outcome is error when the query does not parse. The query is not recorded.',
})

export const VisionLintUsed = defineEvent<{action: 'open' | 'fix'}>({
  name: 'Vision Lint Used',
  version: 1,
  description:
    'User opened Vision lint or applied one of its suggestions. The finding and the query are not recorded.',
})

/** The export query dialog's snippets */
export type VisionSnippet = 'client' | 'curl' | 'next-sanity' | 'astro' | 'sveltekit' | 'nuxt'

export const VisionSnippetCopied = defineEvent<{snippet: VisionSnippet}>({
  name: 'Vision Snippet Copied',
  version: 1,
  description: 'User copied an exported Vision query snippet. The snippet source is not recorded.',
})

export type VisionAgentAction =
  | 'generate-query'
  | 'edit-query'
  | 'fix-lint'
  | 'generate-mutations'
  | 'explain'
  | 'improve-query'
  | 'fit-document-list'

export const VisionAgentActionInvoked = defineEvent<{action: VisionAgentAction}>({
  name: 'Vision Agent Action Invoked',
  version: 1,
  description:
    'User started a Vision agent action. The prompt and the generated text are not recorded.',
})

/** User opened the upsell for AI credits, from the credits status or an AI action out of credits */
export const VisionAiUpsellOpened = defineEvent({
  name: 'Vision AI Upsell Opened',
  version: 1,
  description: 'User opened the Vision upsell for more AI credits.',
})

/** User asked for the query plan, without the AI explanation */
export const VisionQueryPlanShown = defineEvent({
  name: 'Vision Query Plan Shown',
  version: 1,
  description: 'User showed the execution plan of a Vision query. The plan is not recorded.',
})

/**
 * - `view-changes`: expanded the diff of a result with the previous one
 * - `retry`: retried a diff that failed
 * - `show-hidden`: showed the fields the diff hides
 */
export type VisionHistoryAction = 'view-changes' | 'retry' | 'show-hidden'

export const VisionHistoryUsed = defineEvent<{action: VisionHistoryAction}>({
  name: 'Vision History Used',
  version: 1,
  description: 'User used the Vision fetch history. Queries and results are not recorded.',
})

/**
 * The functions library
 * - `save`: saved a function the query declares
 * - `insert`: declared a saved function in the query
 * - `replace`: replaced the query's declaration with the saved one
 * - `remove`: removed a function from the library
 * - `reveal`: jumped to a declaration in the query
 * - `extract`: made a projection in the query a function
 */
export type VisionFunctionAction = 'save' | 'insert' | 'replace' | 'remove' | 'reveal' | 'extract'

export const VisionFunctionUsed = defineEvent<{action: VisionFunctionAction}>({
  name: 'Vision Function Used',
  version: 1,
  description: 'User used the Vision GROQ functions library. Functions are not recorded.',
})

/**
 * The Mutate drawer
 * - `add-patch`, `add-create`, `add-delete`: added a mutation template
 * - `preview`: previewed the mutations' effect
 * - `apply`: applied them to the dataset
 */
export type VisionMutateAction = 'add-patch' | 'add-create' | 'add-delete' | 'preview' | 'apply'

export const VisionMutateUsed = defineEvent<{action: VisionMutateAction}>({
  name: 'Vision Mutate Used',
  version: 1,
  description: 'User used the Vision Mutate drawer. Mutations and documents are not recorded.',
})

/** User loaded a document's changes in the Delta drawer */
export const VisionDeltaLoaded = defineEvent({
  name: 'Vision Delta Loaded',
  version: 1,
  description: 'User loaded a document in the Vision Delta drawer. The document is not recorded.',
})
