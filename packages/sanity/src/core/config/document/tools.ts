import {type ComponentType} from 'react'

import {type DocumentToolContext} from '../types'

/**
 * Every tool id Sanity defines.
 *
 * Asserting on this list in a test is the only warning available when an upgrade adds a
 * built-in, so it is exported for config to enumerate at runtime.
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
 * `'header'` is the only one. The overflow menu is built from `PaneMenuItem` data, not React
 * components, so a contributed renderer placed there would be discarded silently.
 *
 * @hidden
 * @beta
 */
export type DocumentToolPlacement = 'header'

/**
 * A tool the document form draws itself at a fixed site. It carries no `placement` and no
 * `render` because the form owns both.
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
 * A tool contributed by a host or a plugin. It says where it goes and what to draw.
 *
 * @hidden
 * @beta
 */
export interface ContributedDocumentTool {
  /** Stable identifier. `document.tools` addresses this. */
  id: DocumentToolId
  placement: DocumentToolPlacement
  /**
   * What to draw. Declare it at module scope: the resolver re-runs whenever its inputs change,
   * and a component identity created inside it remounts the tool on every run.
   */
  render: ComponentType
  /** Keyboard shortcut, in `is-hotkey` syntax. */
  shortcut?: string
}

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
 * The document form's tools, resolved for one document. Plain data: loggable, snapshot-testable,
 * diffable.
 *
 * @hidden
 * @beta
 */
export interface ResolvedDocumentTools {
  /** Contributed tools placed in the header, in the order the resolver left them. */
  readonly header: readonly ContributedDocumentTool[]
  /** Every resolved tool, keyed by id. Duplicate ids resolve to the last one. */
  readonly byId: ReadonlyMap<DocumentToolId, DocumentTool>
}
