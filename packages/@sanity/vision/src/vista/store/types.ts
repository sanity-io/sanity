import {type ContentSourceMap, type SanityClient, type SyncTag} from '@sanity/client'

import {type SupportedPerspective} from '../../perspectives'

/**
 * Per-tab request options. `perspective: undefined` means "no perspective", letting the API pick
 * its default for the selected API version.
 */
export interface VistaTabOptions {
  dataset: string
  /**
   * Any API version, listed in `API_VERSIONS` or typed into the "Other" input. May be unfinished
   * (and therefore invalid) while the user is typing; the request builder refuses to run then.
   */
  apiVersion: string
  perspective: SupportedPerspective | undefined
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
export interface VistaSettings {
  dataset: string
  apiVersion: string
  perspective: SupportedPerspective | undefined
  includeSourceMap: boolean
}

export type VistaDrawer = 'saved' | 'shared'

export type VistaDialog = 'shortcuts' | 'settings'

export interface VistaSidebarState {
  expanded: boolean
  drawer: VistaDrawer | null
}

/** The collapsible panels below the query editor */
export type VistaPanel = 'params' | 'options'

/** Whether each collapsible panel is expanded */
export type VistaPanelsState = Record<VistaPanel, boolean>

/** The part of the state that survives reloads (per project, in `localStorage`) */
export interface VistaPersistedState {
  version: 1
  tabs: VistaTab[]
  activeTabId: string
  settings: VistaSettings
  sidebar: VistaSidebarState
  panels: VistaPanelsState
}

export type FetchReason =
  | {type: 'manual'}
  | {type: 'shortcut'}
  | {type: 'options'}
  | {type: 'live'; matchedTags: SyncTag[]}

export interface FetchHistoryEntry {
  id: string
  /** ISO timestamp for when the fetch was requested */
  requestedAt: string
  reason: FetchReason
  status: 'ok' | 'error'
  /** Server-reported execution time */
  ms: number | undefined
  /** Round trip as measured by the browser */
  e2eMs: number | undefined
  errorMessage: string | undefined
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
