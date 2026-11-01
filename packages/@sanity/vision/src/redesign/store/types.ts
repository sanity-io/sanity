import {type ContentSourceMap, type SanityClient, type SyncTag} from '@sanity/client'

import {type QueryNetwork} from '../util/queryNetwork'

/** Whether a tab queries the workspace's dataset, following it, or one pinned by hand */
export type VisionDatasetMode = 'workspace' | 'pinned'

/**
 * A tab's perspective. `global` follows the studio's navbar (the pinned release stack,
 * published, or the default drafts) like the rest of the studio; the others are Vision's own,
 * and `undefined` sends none, letting the API pick its default for the API version.
 */
export type VisionPerspective =
  | 'global'
  | 'raw'
  | 'published'
  | 'drafts'
  | 'scheduledDrafts'
  | undefined

/** Whether the navbar's variant is sent with the query */
export type VisionVariantMode = 'global' | 'none'

/** Per-tab request options */
export interface VisionTabOptions {
  datasetMode: VisionDatasetMode
  /** The pinned dataset; while following the workspace, this is what pinning starts from */
  dataset: string
  /**
   * Any API version, listed in `API_VERSIONS` or typed into the "Other" input. May be unfinished
   * (and therefore invalid) while the user is typing; the request builder refuses to run then.
   */
  apiVersion: string
  perspective: VisionPerspective
  variant: VisionVariantMode
  includeSourceMap: boolean
  /**
   * Queries go to the API CDN (`useCdn` in `@sanity/client`), whose answers are cached for up to
   * a minute, rather than the live API. It serves neither the `drafts` perspective nor a stack,
   * so with those the query goes to the API anyway, as it does from the client.
   */
  useCdn: boolean
}

export interface VisionTab {
  id: string
  /** User-provided title. When `undefined`, a title is derived from the query. */
  title: string | undefined
  query: string
  rawParams: string
  options: VisionTabOptions
  autoRefetch: boolean
}

/** Fields for creating a tab or loading a query into one; everything unspecified keeps its value */
export type VisionTabInit = Partial<Omit<VisionTab, 'options'>> & {
  options?: Partial<VisionTabOptions>
}

/** Defaults applied to tabs created with the "+" button */
export type VisionSettings = VisionTabOptions

/** The active tab's tools, which the tab renders into the drawer (see `TabDrawerSlot`) */
export type VisionTabDrawer = 'lint' | 'functions' | 'delta' | 'mutate'

/** What the sidebar opens next to it: the query lists, the active tab's tools and the settings */
export type VisionDrawer = 'saved' | 'shared' | VisionTabDrawer | 'settings'

export type VisionDialog = 'shortcuts'

export interface VisionSidebarState {
  expanded: boolean
  drawer: VisionDrawer | null
}

/** The collapsible panels below the query editor */
export type VisionPanel = 'params' | 'options'

/** How the params panel edits the params: their JSON, or a form inferred from the query */
export type VisionParamsView = 'json' | 'form'

/** How the result shows: a tree to browse, or its JSON as text to select and copy from */
export type VisionResultView = 'tree' | 'json' | 'graph'

/** Whether each collapsible panel is expanded, and how the params and the result show */
export interface VisionPanelsState extends Record<VisionPanel, boolean> {
  paramsView: VisionParamsView
  resultView: VisionResultView
}

/** How the History panel diffs a result with the previous one */
export interface VisionHistoryDiffSettings {
  /**
   * Dotted field paths left out of the diffs, matched at any depth of the result: `_rev` hides
   * the revision of every document in it, `_system.base.rev` that nested field wherever it is
   */
  hiddenFields: string[]
}

/** A custom GROQ function kept in the functions library, to declare in any query */
export interface VisionSavedFunction {
  /** `ns::name`, unique in the library */
  id: string
  /** `fn ns::name($param) = $param{…}`, without the closing `;` */
  declaration: string
}

/** The part of the state that survives reloads (per project, in `localStorage`) */
export interface VisionPersistedState {
  version: 1
  tabs: VisionTab[]
  activeTabId: string
  settings: VisionSettings
  sidebar: VisionSidebarState
  panels: VisionPanelsState
  historyDiff: VisionHistoryDiffSettings
  /** The functions library, most recently saved first */
  functions: VisionSavedFunction[]
}

export type FetchReason =
  | {type: 'manual'}
  | {type: 'shortcut'}
  | {type: 'options'}
  /** A query loaded into a tab that refetches automatically */
  | {type: 'load'}
  /** A tab that refetches automatically was shown again, with nothing current to replay */
  | {type: 'resume'}
  /** The Live button, which fetches like Fetch and then refetches automatically */
  | {type: 'live-start'}
  /** A tab opened with a generated query, fetched as it is shown */
  | {type: 'generated'}
  /** A query URL pasted into the tab, run as pasted, as the classic tool does */
  | {type: 'paste'}
  /** A query URL a link to the tool named, opened in a tab of its own and run as written */
  | {type: 'link'}
  /** Mutations applied from the Mutate panel, after which the result may have changed */
  | {type: 'mutation'}
  /** `eventId` is the live event's, which makes the API CDN answer with content at least as new */
  | {type: 'live'; matchedTags: SyncTag[]; eventId?: string}

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
  query: string
  params: Record<string, unknown>
  status: 'ok' | 'error'
  /** Server-reported execution time */
  ms: number | undefined
  /** Round trip as measured by the browser */
  e2eMs: number | undefined
  errorMessage: string | undefined
  /** How the response travelled (CDN or API, a CDN cache hit, where it ran); failures have none */
  network: QueryNetwork | undefined
  /**
   * The result, for as long as it is among the most recent results kept in memory; failures
   * have none
   */
  result: HistoryResult | undefined
  /** Undefined for failures and for the first result of the tab */
  resultChange: ResultChange | undefined
}

export interface VisionResponseMeta {
  url: string
  ms: number
  e2eMs: number
  payloadBytes: number
  syncTags: SyncTag[]
  resultSourceMap: ContentSourceMap | undefined
  /** `undefined` when the response's headers could not be read */
  network: QueryNetwork | undefined
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
  /** Sent to the API CDN; `url` has its host */
  useCdn: boolean
  /** The GET URL of the request, shown in the response panel and used for saved queries */
  url: string
}
