import {
  type ContributedHeaderTool,
  type ContributedMenuTool,
  type DocumentTool,
  type DocumentToolId,
  type ResolvedDocumentTools,
} from 'sanity'

/**
 * Mirrors `SANITY_DEFINED_TOOLS`, which is `@internal` to `core/config/document` and is exported
 * from no entry point, so tests outside `core` have no other source for the seed.
 */
export const SEEDED_TOOLS: readonly DocumentTool[] = [
  {id: 'titleBar'},
  {id: 'versionPicker'},
  {id: 'copyActions'},
  {id: 'inspect', shortcut: 'Ctrl+Alt+I'},
  {id: 'compareVersions'},
  {id: 'inlineChanges'},
  {id: 'productionPreview', shortcut: 'Ctrl+Alt+O'},
]

interface BuildResolvedToolsOptions {
  /** Ids the config resolver filtered out of `prev`. */
  without?: readonly DocumentToolId[]
  /** Contributed header tools, in the order the resolver left them. */
  header?: readonly ContributedHeaderTool[]
  /** Contributed menu tools, in the order the resolver left them. */
  menu?: readonly ContributedMenuTool[]
}

/**
 * A `ResolvedDocumentTools` shaped the way `resolveDocumentTools` shapes one, so a test states
 * only what its case changes.
 */
export function buildResolvedTools(options: BuildResolvedToolsOptions = {}): ResolvedDocumentTools {
  const {without = [], header = [], menu = []} = options
  const removed = new Set<DocumentToolId>(without)

  const builtIns = SEEDED_TOOLS.filter((tool) => !removed.has(tool.id))
  const headerTools = header.filter((tool) => !removed.has(tool.id))
  const menuTools = menu.filter((tool) => !removed.has(tool.id))

  return {
    header: headerTools,
    menu: menuTools,
    byId: new Map([...builtIns, ...headerTools, ...menuTools].map((tool) => [tool.id, tool])),
  }
}

/** A `ResolvedDocumentTools` with nothing in it: every gate off, nothing contributed. */
export const EMPTY_TOOLS: ResolvedDocumentTools = Object.freeze({
  header: [],
  menu: [],
  byId: new Map(),
})
