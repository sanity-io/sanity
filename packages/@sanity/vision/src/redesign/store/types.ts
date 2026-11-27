import {type ContentSourceMap, type SanityClient, type SyncTag} from '@sanity/client'

import {type QueryRequestMethod} from '../../util/queryRequestMethod'
import {type QueryNetwork} from '../util/queryNetwork'

/**
 * Whether a tab queries the workspace's dataset (`auto`, following it when the workspace
 * changes) or one chosen by hand (`override`, which stays put)
 */
export type VisionDatasetMode = 'auto' | 'override'

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
  /** The overriding dataset; on `auto`, the workspace's dataset when the tab was last saved */
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
  /**
   * The shared query (a `vision.sharedQuery` document) the tab is linked to: the user shared the
   * tab, or opened a shared query from the Shared tabs drawer. Edits keep it, so the author can
   * share the tab again or unshare it after it changed, and everyone with the query open sees
   * who else has it open. Only a link to a query the user authored makes the tab shared.
   */
  sharedId: string | undefined
}

/** Fields for creating a tab or loading a query into one; everything unspecified keeps its value */
export type VisionTabInit = Partial<Omit<VisionTab, 'options'>> & {
  options?: Partial<VisionTabOptions>
}

/** A closed tab, which the Restore tabs drawer reopens as it was until it is purged */
export interface VisionClosedTab {
  tab: VisionTab
  /** ISO timestamp for when the tab was closed */
  closedAt: string
}

/** Defaults applied to tabs created with the "+" button */
export type VisionSettings = VisionTabOptions

/** The active tab's tools, which the tab renders into the drawer (see `TabDrawerSlot`) */
export type VisionTabDrawer = 'delta' | 'mutate'

/** What the sidebar opens next to it: the tab lists, the active tab's tools and the settings */
export type VisionDrawer = 'closed-tabs' | 'shared' | VisionTabDrawer | 'settings'

export type VisionDialog = 'shortcuts'

export interface VisionSidebarState {
  expanded: boolean
  drawer: VisionDrawer | null
}

/** The collapsible panels below the query editor */
export type VisionPanel = 'params' | 'options'

/** How the params panel edits the params: their JSON, or a form inferred from the query */
export type VisionParamsView = 'json' | 'form'

/**
 * How the result shows: its JSON as text to select and copy from, a tree to browse, a graph, or
 * the documents it lists
 */
export type VisionResultView = 'tree' | 'json' | 'graph' | 'documents'

/** Whether each collapsible panel is expanded, and how the params and the result show */
export interface VisionPanelsState extends Record<VisionPanel, boolean> {
  paramsView: VisionParamsView
  resultViewer: VisionResultView
}

/** How the History panel diffs a result with the previous one */
export interface VisionHistoryDiffSettings {
  /**
   * Dotted field paths left out of the diffs, matched at any depth of the result: `_rev` hides
   * the revision of every document in it, `_system.base.rev` that nested field wherever it is
   */
  hiddenFields: string[]
}

/**
 * The AI features a user keeps on. They only switch features off: one the tool's `ai` option
 * turns off stays off whatever is stored here.
 */
export interface VisionAiSettings {
  /** `false` switches every AI feature off, whatever the per-feature settings say */
  enabled: boolean
  generateQuery: boolean
  editQuery: boolean
  fixLint: boolean
  generateMutations: boolean
  explainQuery: boolean
}

/** The code snippets the Export query dialog can show, one per tab */
export type VisionExportSnippetId =
  | 'client'
  | 'curl'
  | 'next-sanity'
  | 'astro'
  | 'sveltekit'
  | 'nuxt'

/** Which snippets the Export query dialog shows, and in what order */
export interface VisionExportSnippetSettings {
  /** Every snippet, in tab order */
  order: VisionExportSnippetId[]
  /** Snippets left out of the dialog; never all of them */
  hidden: VisionExportSnippetId[]
}

/** How the query editor behaves */
export interface VisionEditorSettings {
  /**
   * Reformats a query laid out for the editor's old width (as Prettify does) for the new one
   * once a resize of the query editor settles; a query laid out by hand is never touched
   */
  autoFormatOnResize: boolean
}

/**
 * The `resultSourceMap` value sent when a query asks for a content source map: the plain source
 * map, or the one whose array paths select items by `_key` (`@sanity/client` accepts both)
 */
export type VisionResultSourceMap = true | 'withKeyArraySelector'

/** What the Response panel shows about a response */
export interface VisionResponseSettings {
  /**
   * The Sync tags row can switch between the tags as they came and the documents they stand for,
   * found with extra queries to the dataset the response came from
   */
  resolveSyncTags: boolean
  /**
   * Turns on the Content Source Map features: the "Include content source map" option and the
   * Content Source Map tab. While off, no query or export snippet asks for a source map, whatever
   * the tabs' options say.
   */
  sourceMapEnabled: boolean
  /**
   * Sent by every fetch that asks for a content source map: with "Include content source map"
   * on, from the Content Source Map tab's one-off fetch, and in the Export query snippets
   */
  resultSourceMap: VisionResultSourceMap
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
  ai: VisionAiSettings
  editor: VisionEditorSettings
  response: VisionResponseSettings
  exportSnippets: VisionExportSnippetSettings
  /** The functions library, most recently saved first */
  functions: VisionSavedFunction[]
  /** The tabs closed in this browser that the Restore tabs drawer lists, most recently closed first */
  closedTabs: VisionClosedTab[]
  /**
   * The keys of the personal saved queries this browser has opened as tabs, or found a tab
   * already showing, so each opens once: a closed one stays closed on the next load
   */
  openedSavedQueries: string[]
}

/** A lint finding as the Lint tab listed it when Fix with AI was asked to fix it */
export interface AiLintFinding {
  /** 1-based, like the editor's gutter */
  line: number
  column: number
  severity: 'error' | 'warning' | 'info' | 'hint'
  message: string
}

/** An AI action that writes a tab's query, and what it was given */
export type AiQueryAction =
  | {action: 'generate'; prompt: string}
  | {action: 'edit'; prompt: string}
  | {action: 'fix-lint'; findings: AiLintFinding[]}
  | {action: 'improve'; summary: string; suggestions: string[]}
  | {action: 'fit-document-list'}

/**
 * The AI action that wrote a generated query, and what it was given: the user's prompt, the lint
 * findings, or the explanation the improvement followed. Kept on the fetch's history entry, since
 * the prompt bars and panels clear once the query is in the editor.
 */
export type AiQueryChange = AiQueryAction & {
  /** The tab's query when the action started, which the result replaced */
  fromQuery: string
}

export type FetchReason =
  | {type: 'manual'}
  | {type: 'shortcut'}
  | {type: 'options'}
  /** A query loaded into a tab that refetches automatically */
  | {type: 'load'}
  /** A tab that refetches automatically was shown again, with nothing current to replay */
  | {type: 'resume'}
  /**
   * A tab opened with a generated query, fetched as it is shown; `ai` says which AI action wrote
   * it, and is missing for a query an agent outside the tool opened
   */
  | {type: 'generated'; ai?: AiQueryChange}
  /** A query URL pasted into the tab, run as pasted, as the classic tool does */
  | {type: 'paste'}
  /** A query URL a link to the tool named, opened in a tab of its own and run as written */
  | {type: 'link'}
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
  /**
   * How the query was sent: `GET` with the query and params in `url`, or `POST` with them as a
   * JSON body once they are too long for a URL. What the transport reported, or the client's
   * rule (`queryRequestMethod`) where it could not be read.
   */
  method: QueryRequestMethod
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
  /** Asks for a content source map with this value; `undefined` asks for none */
  resultSourceMap: VisionResultSourceMap | undefined
  /** Sent to the API CDN; `url` has its host */
  useCdn: boolean
  /** The GET URL of the request, shown in the response panel and used for saved queries */
  url: string
}
