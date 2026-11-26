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
 * - `params`, `options`: the redesign's panels below the query editor
 * - `response`: the redesign's response panel
 */
export type VisionPanel = 'saved-queries' | 'sidebar' | 'params' | 'options' | 'response'

export const VisionPanelToggled = defineEvent<{panel: VisionPanel; open: boolean}>({
  name: 'Vision Panel Toggled',
  version: 1,
  description: 'User opened or collapsed a Vision panel.',
})
