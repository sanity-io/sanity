import {type VersionFeedRange} from '../../../inventoryModel/feed/createVersionFeed'
import {documentLens} from '../../../inventoryModel/lenses'
import {
  type InventoryIndex,
  type VersionKind,
  type VersionStub,
} from '../../../inventoryModel/types'
import {
  getReleaseIdFromReleaseDocumentId,
  isReleaseDocumentId,
} from '../../../releases/util/getReleaseIdFromReleaseDocumentId'
import {EXCLUDE_AGENT_VERSIONS_FILTER} from '../../../search/constants'
import {type ListenQueryParams} from '../../../store/document/listenQuery'
import {type VariantId} from '../../types'
import {encodeVariantLinkParam} from '../../util/variantSelection'
import {getVariantId} from '../util'

/**
 * The document pane inspector that shows the version inventory. Mirrors
 * `DOCUMENT_GROUP_INSPECTOR_NAME` in `structure/panes/document/constants`, which core cannot
 * import; the edit intent forwards it to the pane as its `inspect` param.
 *
 * @internal
 */
export const VERSION_INVENTORY_INSPECTOR_NAME = 'sanity/structure/document-group'

/** The definition filter value for versions that belong to no definition. @internal */
export const DEFAULT_DEFINITION = 'default'

// `bundle` is a release document id when the version carries `_system.release`, and the bare
// bundle id otherwise.
function toReleaseId(bundle: string): string {
  return isReleaseDocumentId(bundle) ? getReleaseIdFromReleaseDocumentId(bundle) : bundle
}

/** @internal */
export interface VersionFilters {
  /** A definition id, or {@link DEFAULT_DEFINITION}. */
  definition?: VariantId | typeof DEFAULT_DEFINITION
  /** A release document id. */
  release?: string
  state?: Exclude<VersionKind, 'agent'>
}

/** @internal */
export type VersionSort = 'last-edited' | 'version-order'

/**
 * Keeps the rows that match every set filter.
 *
 * @internal
 */
export function filterVersions(rows: VersionStub[], filters: VersionFilters): VersionStub[] {
  return rows.filter(
    (row) =>
      (!filters.definition ||
        (filters.definition === DEFAULT_DEFINITION
          ? row.variantId === undefined
          : row.variantId === filters.definition)) &&
      (!filters.release || (row.kind === 'release' && row.bundle === filters.release)) &&
      (!filters.state || row.kind === filters.state),
  )
}

/**
 * Orders the versions of one document. `rows` must come in the shared version order (as
 * `documentLens` returns them), which `version-order` keeps; `last-edited` puts the most recent
 * edit first.
 *
 * @internal
 */
export function orderVersions(rows: VersionStub[], sort: VersionSort): VersionStub[] {
  return sort === 'last-edited'
    ? rows.toSorted((left, right) => Date.parse(right._updatedAt) - Date.parse(left._updatedAt))
    : rows
}

/**
 * The GROQ filter that picks the feed's documents: those with at least one version matching every
 * set filter. The feed then loads every version of those documents, and {@link filterVersions}
 * keeps the matching rows. Content only: no system documents and no assets.
 *
 * @internal
 */
export function buildDocumentLensFilter({
  type,
  filters,
}: {
  type: string | undefined
  filters: VersionFilters
}): {filter: string; params: ListenQueryParams} {
  const clauses = [
    '!(_id in path("_.**"))',
    '!string::startsWith(_type, "sanity.")',
    // Agent versions, which every lens leaves out: by their `versions.agent-<id>.<id>` id, or by
    // the agent bundle on `_system.bundleId` for variant-scoped ones, whose ids are opaque.
    EXCLUDE_AGENT_VERSIONS_FILTER,
  ]
  const params: ListenQueryParams = {}

  if (type) {
    clauses.push('_type == $type')
    params.type = type
  }
  if (filters.definition === DEFAULT_DEFINITION) {
    clauses.push('!defined(_system.variants[0]) && !defined(_system.variant)')
  } else if (filters.definition) {
    clauses.push('sanity::partOfVariant($variantId)')
    params.variantId = getVariantId(filters.definition)
  }
  if (filters.release) {
    // Variant versions in a release carry `_system.release`; plain release versions only carry
    // the release name in their id (`versions.<release>.<id>`), so both forms are matched. `**`,
    // not `*`: a published id can contain dots, and `*` matches one segment.
    clauses.push(
      '(_system.release._ref == $releaseRef || _id in path("versions." + $releaseName + ".**"))',
    )
    params.releaseRef = filters.release
    params.releaseName = toReleaseId(filters.release)
  }
  if (filters.state === 'published') {
    // Classic drafts and plain release versions have no `_system.bundleId` either, so they are
    // excluded by id. Published variant versions live under `versions.**` too, and keep their
    // variant reference, so they stay in.
    clauses.push(
      '!defined(_system.bundleId) && !defined(_system.release) && !(_id in path("drafts.**")) && ' +
        '(!(_id in path("versions.**")) || defined(_system.variants[0]) || defined(_system.variant))',
    )
  } else if (filters.state === 'draft') {
    // Variant drafts carry `_system.bundleId`; classic drafts only their `drafts.` id.
    clauses.push('(_system.bundleId == "drafts" || _id in path("drafts.**"))')
  } else if (filters.state === 'release') {
    // Plain release versions have `_system: null`, so they are matched by id: under
    // `versions.**` without a variant reference (agent versions are excluded above).
    clauses.push(
      '(defined(_system.release) || (_id in path("versions.**") && ' +
        '!defined(_system.variants[0]) && !defined(_system.variant)))',
    )
  }

  return {filter: clauses.join(' && '), params}
}

/**
 * A row of the Document lens: a version, or a placeholder for a document whose page has not
 * loaded yet. Placeholders keep the table as long as the feed's document list, so it scrolls to
 * documents that are not loaded and the feed loads them.
 *
 * @internal
 */
export type DocumentLensRow = VersionStub & {placeholder?: true}

function placeholderRow(groupId: string): DocumentLensRow {
  return {
    _id: `placeholder.${groupId}`,
    _type: '',
    _updatedAt: '',
    groupId,
    variantId: undefined,
    kind: 'published',
    bundle: '',
    goingToUnpublish: false,
    placeholder: true,
  }
}

/**
 * The rows of the Document lens, in the feed's document order: each loaded document's versions
 * (from the shared `documentLens`, filtered and ordered), or one placeholder per document that is
 * not loaded.
 *
 * @internal
 */
export function toDocumentLensRows({
  groupIds,
  index,
  filters,
  sort,
}: {
  groupIds: string[]
  index: InventoryIndex
  filters: VersionFilters
  sort: VersionSort
}): DocumentLensRow[] {
  const byGroup = new Map<string, VersionStub[]>()
  for (const row of documentLens(index)) {
    const group = byGroup.get(row.groupId)
    if (group) {
      group.push(row)
    } else {
      byGroup.set(row.groupId, [row])
    }
  }

  return groupIds.flatMap((groupId): DocumentLensRow[] => {
    if (!index.byGroup.has(groupId)) return [placeholderRow(groupId)]
    return orderVersions(filterVersions(byGroup.get(groupId) ?? [], filters), sort)
  })
}

/**
 * The feed range covering the documents on screen, from the group ids of the visible rows.
 *
 * @internal
 */
export function getVisibleRange(
  groupIds: string[],
  visibleGroupIds: Iterable<string>,
): VersionFeedRange | undefined {
  const positions = new Map(groupIds.map((groupId, position) => [groupId, position]))
  let start = Infinity
  let end = -Infinity
  for (const groupId of visibleGroupIds) {
    const position = positions.get(groupId)
    if (position === undefined) continue
    start = Math.min(start, position)
    end = Math.max(end, position + 1)
  }
  return Number.isFinite(start) ? {start, end} : undefined
}

/**
 * Collects the documents whose rows are mounted. The table only mounts the rows on screen (plus a
 * few), so this is what is visible; it reports once per batch of mounts and unmounts.
 *
 * It reports only between `start()` and the stop function `start()` returns, so the component
 * that owns it starts it in an effect: a report never lands after that component unmounts (or
 * while it is hidden), and starting again reports whatever changed meanwhile.
 *
 * @internal
 */
export function createVisibleRowTracker(
  onChange: (groupIds: string[]) => void,
  schedule: (flush: () => void) => () => void = (flush) => {
    const timeout = setTimeout(flush, 50)
    return () => clearTimeout(timeout)
  },
): {track: (groupId: string) => () => void; start: () => () => void} {
  const counts = new Map<string, number>()
  let started = false
  let changed = false
  let cancel: (() => void) | undefined
  const flush = () => {
    cancel = undefined
    changed = false
    onChange([...counts.keys()])
  }
  const requestFlush = () => {
    changed = true
    if (started && !cancel) cancel = schedule(flush)
  }
  const change = (groupId: string, delta: number) => {
    const count = (counts.get(groupId) ?? 0) + delta
    if (count > 0) counts.set(groupId, count)
    else counts.delete(groupId)
    requestFlush()
  }
  return {
    track: (groupId) => {
      change(groupId, 1)
      return () => change(groupId, -1)
    },
    start: () => {
      started = true
      if (changed) requestFlush()
      return () => {
        started = false
        cancel?.()
        cancel = undefined
      }
    },
  }
}

/**
 * Where a row opens: the document, on the row's version, with the version inventory open. Also
 * the perspective stack its preview resolves in.
 *
 * @internal
 */
export function getVersionLinkTarget(
  row: VersionStub,
  variantType?: string,
): {
  params: {id: string; type: string; inspect: string}
  searchParams: [string, string][]
  perspectiveStack: string[]
} {
  // `variant` and `perspective` are sticky: an intent link keeps the current values unless it sets
  // them. Every row sets both, so it opens on its own version and not on the one selected in the
  // navbar; an empty value clears the param (no variant: the Default version; no perspective:
  // drafts), as setting the perspective or the variant in the navbar does.
  let perspective = ''
  let perspectiveStack = ['drafts']
  if (row.kind === 'published') {
    perspective = 'published'
    perspectiveStack = ['published']
  } else if (row.kind === 'release') {
    perspective = toReleaseId(row.bundle)
    perspectiveStack = [perspective, 'drafts']
  }
  const searchParams: [string, string][] = [
    ['variant', row.variantId ? encodeVariantLinkParam(row.variantId, variantType) : ''],
    ['perspective', perspective],
  ]

  return {
    params: {id: row.groupId, type: row._type, inspect: VERSION_INVENTORY_INSPECTOR_NAME},
    searchParams,
    perspectiveStack,
  }
}

/**
 * The bare variant id a row's preview resolves in, if any.
 *
 * @internal
 */
export function getRowPreviewVariant(row: VersionStub): string | undefined {
  return row.variantId ? getVariantId(row.variantId) : undefined
}
