import {type ContentSourceMap, type SanityClient, type SyncTag} from '@sanity/client'

/** Whether a tab queries the workspace's dataset, following it, or one pinned by hand */
export type VistaDatasetMode = 'workspace' | 'pinned'

/**
 * A tab's perspective. `global` follows the studio's navbar (the pinned release stack,
 * published, or the default drafts) like the rest of the studio; the others are Vision's own,
 * and `undefined` sends none, letting the API pick its default for the API version.
 */
export type VistaPerspective =
  | 'global'
  | 'raw'
  | 'published'
  | 'drafts'
  | 'scheduledDrafts'
  | undefined

/** Whether the navbar's variant is sent with the query */
export type VistaVariantMode = 'global' | 'none'

/** Per-tab request options */
export interface VistaTabOptions {
  datasetMode: VistaDatasetMode
  /** The pinned dataset; while following the workspace, this is what pinning starts from */
  dataset: string
  /**
   * Any API version, listed in `API_VERSIONS` or typed into the "Other" input. May be unfinished
   * (and therefore invalid) while the user is typing; the request builder refuses to run then.
   */
  apiVersion: string
  perspective: VistaPerspective
  variant: VistaVariantMode
  includeSourceMap: boolean
}

export interface VistaTab {
  id: string
  /** User-provided title. When `undefined`, a title is derived from the query. */
  title: string | undefined
  query: string
  rawParams: string
  options: VistaTabOptions
  autoRefetch: boolean
}

/** Fields for creating a tab or loading a query into one; everything unspecified keeps its value */
export type VistaTabInit = Partial<Omit<VistaTab, 'options'>> & {
  options?: Partial<VistaTabOptions>
}

/** Defaults applied to tabs created with the "+" button */
export type VistaSettings = VistaTabOptions

export type VistaDrawer = 'saved' | 'shared'

export type VistaDialog = 'shortcuts' | 'settings'

export interface VistaSidebarState {
  expanded: boolean
  drawer: VistaDrawer | null
}

/** The collapsible panels below the query editor */
export type VistaPanel = 'params' | 'options'

/** How the params panel edits the params: their JSON, or a form inferred from the query */
export type VistaParamsView = 'json' | 'form'

/** Whether each collapsible panel is expanded, and how the params panel shows the params */
export interface VistaPanelsState extends Record<VistaPanel, boolean> {
  paramsView: VistaParamsView
}

/** How the History panel diffs a result with the previous one */
export interface VistaHistoryDiffSettings {
  /**
   * Dotted field paths left out of the diffs, matched at any depth of the result: `_rev` hides
   * the revision of every document in it, `_system.base.rev` that nested field wherever it is
   */
  hiddenFields: string[]
}

/** The part of the state that survives reloads (per project, in `localStorage`) */
export interface VistaPersistedState {
  version: 1
  tabs: VistaTab[]
  activeTabId: string
  settings: VistaSettings
  sidebar: VistaSidebarState
  panels: VistaPanelsState
  historyDiff: VistaHistoryDiffSettings
}

export type FetchReason =
  | {type: 'manual'}
  | {type: 'shortcut'}
  | {type: 'options'}
  /** A query loaded into a tab that refetches automatically */
  | {type: 'load'}
  /** A tab that refetches automatically was shown again, with nothing current to replay */
  | {type: 'resume'}
  | {type: 'live'; matchedTags: SyncTag[]}

/** A successful fetch's result, kept on its history entry to compare it with the next one */
export interface HistoryResult {
  value: unknown
  /** Size of the result as compact JSON, in UTF-8 bytes */
  bytes: number
}

/** How a result compares with the one the previous successful fetch returned */
export type ResultChange = 'unchanged' | 'changed' | 'too-large'

export interface FetchHistoryEntry {
  id: string
  /** ISO timestamp for when the fetch was requested */
  requestedAt: string
  reason: FetchReason
  /** URL of the request that was fetched */
  url: string
  status: 'ok' | 'error'
  /** Server-reported execution time */
  ms: number | undefined
  /** Round trip as measured by the browser */
  e2eMs: number | undefined
  errorMessage: string | undefined
  /**
   * The result, for as long as it is among the most recent results kept in memory; failures
   * have none
   */
  result: HistoryResult | undefined
  /** Undefined for failures and for the first result of the tab */
  resultChange: ResultChange | undefined
}

export interface VistaResponseMeta {
  url: string
  ms: number
  e2eMs: number
  payloadBytes: number
  syncTags: SyncTag[]
  resultSourceMap: ContentSourceMap | undefined
}

/**
 * Everything the query runner needs to execute a fetch. Built by the React layer, since the
 * effective perspective depends on studio state (pinned release, variants, scheduled drafts).
 */
export interface QueryRequest {
  /** Client configured with the effective API version, dataset, perspective and variant */
  client: SanityClient
  query: string
  params: Record<string, unknown>
  includeSourceMap: boolean
  /** The GET URL of the request, shown in the response panel and used for saved queries */
  url: string
}
