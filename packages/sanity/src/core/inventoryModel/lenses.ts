import {type VariantId} from '../variants/types'
import {type CellState, type InventoryIndex, type VersionStub} from './types'

/**
 * The state of one document for one definition (`undefined` for Default). A published version
 * wins over a draft, a draft over a release version, since that is what a reader of the cell asks
 * first: is it live?
 *
 * @internal
 */
export function cellState(
  index: InventoryIndex,
  groupId: string,
  variantId: VariantId | undefined,
): CellState {
  const versions = (index.byGroup.get(groupId) ?? []).filter(
    (stub) => stub.variantId === variantId && stub.kind !== 'agent',
  )
  if (versions.some((stub) => stub.kind === 'published')) return 'published'
  if (versions.some((stub) => stub.kind === 'draft')) return 'draft'
  if (versions.some((stub) => stub.kind === 'release')) return 'release'
  return 'absent'
}

/**
 * One line of a document's summary: an audience (Default or a definition) and its versions.
 *
 * @internal
 */
export interface SummaryLine {
  variantId: VariantId | undefined
  versions: VersionStub[]
  /** The most recent edit among the line's versions. */
  latest: VersionStub
}

/**
 * The summary surfaces of one document: the list row's status icons, the hover popover and the
 * flyout. Default first, then the definitions by their latest edit; `maxLines` cuts the list and
 * counts the versions it hides.
 *
 * @internal
 */
export function documentSummary(
  index: InventoryIndex,
  groupId: string,
  {maxLines = Infinity, includeAgent = false}: {maxLines?: number; includeAgent?: boolean} = {},
): {lines: SummaryLine[]; hiddenVersionCount: number} {
  const lines = new Map<VariantId | undefined, VersionStub[]>()
  for (const stub of index.byGroup.get(groupId) ?? []) {
    if (stub.kind === 'agent' && !includeAgent) continue
    const line = lines.get(stub.variantId)
    if (line) {
      line.push(stub)
    } else {
      lines.set(stub.variantId, [stub])
    }
  }

  const all = [...lines.entries()].map(([variantId, versions]) => ({
    variantId,
    versions,
    latest: versions.reduce((latest, stub) =>
      Date.parse(stub._updatedAt) > Date.parse(latest._updatedAt) ? stub : latest,
    ),
  }))
  const sorted = [
    ...all.filter((line) => !line.variantId),
    ...all
      .filter((line) => line.variantId)
      .toSorted(
        (left, right) => Date.parse(right.latest._updatedAt) - Date.parse(left.latest._updatedAt),
      ),
  ]

  return {
    lines: sorted.slice(0, maxLines),
    hiddenVersionCount: sorted
      .slice(maxLines)
      .reduce((count, line) => count + line.versions.length, 0),
  }
}

/**
 * The per-document inventory and the Document lens: one row per stored version, in the shared
 * version order. With `groupIds`, only those documents; otherwise every document in the index.
 *
 * @internal
 */
export function documentLens(
  index: InventoryIndex,
  {groupIds, includeAgent = false}: {groupIds?: Iterable<string>; includeAgent?: boolean} = {},
): VersionStub[] {
  const wanted = groupIds ? new Set(groupIds) : undefined
  return index.versions.filter(
    (stub) => (includeAgent || stub.kind !== 'agent') && (!wanted || wanted.has(stub.groupId)),
  )
}

/**
 * One row of the Definition lens: a document, and its state for the definition.
 *
 * @internal
 */
export interface DefinitionLensRow {
  groupId: string
  state: CellState
}

/**
 * The Definition lens: which documents have a version for a definition, and which do not.
 *
 * `universe` is the set of documents the definition could apply to (for example every document of
 * the chosen type). Its documents without a version form the `absent` half, so the lens works in
 * the browser from two reads: the versions, and the group ids of the universe. Documents with a
 * version that fall outside the universe still count as present.
 *
 * @internal
 */
export function definitionLens(
  index: InventoryIndex,
  variantId: VariantId,
  universe: Iterable<string> = [],
): {present: DefinitionLensRow[]; absent: DefinitionLensRow[]} {
  const presentGroups = index.groupsByVariant.get(variantId) ?? new Set<string>()
  const present = [...presentGroups].map((groupId) => ({
    groupId,
    state: cellState(index, groupId, variantId),
  }))
  const absent: DefinitionLensRow[] = []
  for (const groupId of new Set(universe)) {
    if (!presentGroups.has(groupId)) absent.push({groupId, state: 'absent'})
  }

  return {present, absent}
}
