import {type ComponentType} from 'react'

import {type DocumentToolContext} from '../types'

/**
 * Every tool id Sanity defines. Exported so config can enumerate the built-ins at runtime, and so
 * a test can assert on the list: the only warning available when an upgrade adds one.
 *
 * @hidden
 * @beta
 */
export const SANITY_DEFINED_TOOL_IDS = [
  'titleBar',
  'versionPicker',
  'copyActions',
  'inspect',
  'compareVersions',
  'inlineChanges',
  'productionPreview',
  'splitPane',
  'focusMode',
  'closePane',
  'closePaneGroup',
] as const

/**
 * @hidden
 * @beta
 */
export type SanityDefinedToolId = (typeof SANITY_DEFINED_TOOL_IDS)[number]

/**
 * @hidden
 * @beta
 */
export function isSanityDefinedToolId(id: string): id is SanityDefinedToolId {
  return (SANITY_DEFINED_TOOL_IDS as readonly string[]).includes(id)
}

/**
 * Registry of document tool ids. Extend it by declaration merging to register your own, the same
 * way `DocumentActionKeys` works. The values are unused; use `never`.
 *
 * ```ts
 * declare module 'sanity' {
 *   interface DocumentToolIds {
 *     myPluginPin: never
 *   }
 * }
 * ```
 *
 * @hidden
 * @beta
 */
export interface DocumentToolIds extends Record<SanityDefinedToolId, never> {}

/**
 * @hidden
 * @beta
 */
export type DocumentToolId = keyof DocumentToolIds

/**
 * Where a contributed tool renders. A `type` alias cannot be declaration-merged, so only Sanity
 * adds placements.
 *
 * @hidden
 * @beta
 */
export type DocumentToolPlacement = 'header' | 'menu'

/**
 * A tool the document form draws itself, at a fixed site it owns.
 *
 * @hidden
 * @beta
 */
export interface BuiltInDocumentTool {
  /** Stable identifier. `document.tools` addresses this. */
  id: SanityDefinedToolId
  /** Keyboard shortcut, in `is-hotkey` syntax. */
  shortcut?: string
}

/**
 * A contributed tool drawn as a button in the header, after the built-ins.
 *
 * @hidden
 * @beta
 */
export interface ContributedHeaderTool {
  /** Stable identifier. `document.tools` addresses this. */
  id: DocumentToolId
  placement: 'header'
  /**
   * What to draw. Declare it at module scope: the resolver re-runs whenever its inputs change,
   * and a component identity created inside it remounts the tool on every run.
   */
  render: ComponentType
}

/**
 * A contributed tool drawn as an entry at the end of the overflow menu. Plain data, so the menu
 * button can tell it has contents. An entry that needs React state or the document's edit state
 * is a document action in the `paneActions` group, not a tool.
 *
 * @hidden
 * @beta
 */
export interface ContributedMenuTool {
  /** Stable identifier. `document.tools` addresses this. */
  id: DocumentToolId
  placement: 'menu'
  title: string
  icon?: ComponentType
  onAction: () => void
  /** Keyboard shortcut, in `is-hotkey` syntax. Shown on the entry and fired while the pane has focus. */
  shortcut?: string
}

/**
 * A tool contributed by a host or a plugin.
 *
 * @hidden
 * @beta
 */
export type ContributedDocumentTool = ContributedHeaderTool | ContributedMenuTool

/**
 * @hidden
 * @beta
 */
export type DocumentTool = BuiltInDocumentTool | ContributedDocumentTool

/**
 * @hidden
 * @beta
 */
export type DocumentToolsResolver = (
  prev: DocumentTool[],
  context: DocumentToolContext,
) => DocumentTool[]

/**
 * The document form's tools, resolved for one document.
 *
 * @hidden
 * @beta
 */
export interface ResolvedDocumentTools {
  /** Contributed header tools, in the order the resolver left them. */
  readonly header: readonly ContributedHeaderTool[]
  /** Contributed menu tools, in the order the resolver left them. */
  readonly menu: readonly ContributedMenuTool[]
  /** Every resolved tool, keyed by id. Duplicate ids resolve to the last one. */
  readonly byId: ReadonlyMap<DocumentToolId, DocumentTool>
}
