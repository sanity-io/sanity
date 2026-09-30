import {type ContributedDocumentTool, type DocumentTool, type ResolvedDocumentTools} from './tools'

/**
 * The tools the document form draws itself, at a fixed site. None carries `placement` or
 * `render`: the form draws them where it always has and reads their presence from the
 * resolution.
 *
 * A strict subset of `SANITY_DEFINED_TOOL_IDS`. The four structure ids are addressable by
 * config but enter resolution only when the structure tool contributes them, so that
 * Presentation and standalone embeddings do not resolve them as present.
 *
 * @internal
 */
export const SANITY_DEFINED_TOOLS: readonly DocumentTool[] = [
  {id: 'titleBar'},
  {id: 'versionPicker'},
  {id: 'copyActions'},
  {id: 'inspect', shortcut: 'Ctrl+Alt+I'},
  {id: 'compareVersions'},
  {id: 'inlineChanges'},
  {id: 'productionPreview', shortcut: 'Ctrl+Alt+O'},
]

function isDevelopment(): boolean {
  return process.env.NODE_ENV !== 'production'
}

function isHeaderTool(tool: DocumentTool): tool is ContributedDocumentTool {
  return 'placement' in tool && tool.placement === 'header'
}

function warnAboutDuplicates(duplicated: readonly DocumentTool[]): void {
  const ids = [...new Set(duplicated.map((tool) => tool.id))]
  if (ids.length === 0) return

  console.warn(
    `\`document.tools\` resolved more than one tool with the id ${ids
      .map((id) => `\`${id}\``)
      .join(', ')}. The last one wins.`,
  )
}

/**
 * Normalises the tool list a config resolver returned: duplicates collapse to the last entry, and
 * contributed header tools are partitioned out for the render loop.
 *
 * Unrecognised ids are kept. `DocumentToolIds` is type-only, so declaration merging leaves
 * nothing to check them against, and dropping them against `SANITY_DEFINED_TOOL_IDS` would
 * delete exactly the third-party tools the registry exists to permit.
 *
 * @internal
 */
export function resolveDocumentTools(tools: readonly DocumentTool[]): ResolvedDocumentTools {
  const lastIndexById = new Map(tools.map((tool, index) => [tool.id, index]))
  const winning = tools.filter((tool, index) => lastIndexById.get(tool.id) === index)

  if (isDevelopment()) {
    warnAboutDuplicates(tools.filter((tool, index) => lastIndexById.get(tool.id) !== index))
  }

  return {
    header: winning.filter(isHeaderTool),
    byId: new Map(winning.map((tool) => [tool.id, tool])),
  }
}
