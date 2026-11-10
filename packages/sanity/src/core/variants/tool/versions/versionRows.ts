import {type ReleaseDocument} from '@sanity/client'

import {type VersionKind, type VersionStub} from '../../../inventoryModel/types'
import {
  getReleaseIdFromReleaseDocumentId,
  isReleaseDocumentId,
} from '../../../releases/util/getReleaseIdFromReleaseDocumentId'
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

/** @internal */
export type VersionGrouping = 'none' | 'document' | 'definition'

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

function groupKey(row: VersionStub, grouping: VersionGrouping): string {
  if (grouping === 'document') return row.groupId
  // Default first: an empty key sorts before any definition id.
  if (grouping === 'definition') return row.variantId ?? ''
  return ''
}

/**
 * Orders the rows. `rows` must come in the shared version order (as `documentLens` returns them),
 * which `version-order` keeps; `last-edited` puts the most recent edit first. Grouping keeps the
 * rows of one document (or definition) together, groups in the order of their first row, with the
 * Default definition first.
 *
 * @internal
 */
export function orderVersions(
  rows: VersionStub[],
  {sort, grouping}: {sort: VersionSort; grouping: VersionGrouping},
): VersionStub[] {
  const sorted =
    sort === 'last-edited'
      ? rows.toSorted((left, right) => Date.parse(right._updatedAt) - Date.parse(left._updatedAt))
      : rows
  if (grouping === 'none') return sorted

  const groupRanks = new Map<string, number>()
  for (const row of sorted) {
    const key = groupKey(row, grouping)
    if (!groupRanks.has(key))
      groupRanks.set(key, grouping === 'definition' && key === '' ? -1 : groupRanks.size)
  }
  return sorted.toSorted(
    (left, right) =>
      groupRanks.get(groupKey(left, grouping))! - groupRanks.get(groupKey(right, grouping))!,
  )
}

/**
 * The releases that hold at least one of the rows, for the release filter.
 *
 * @internal
 */
export function getReleaseOptions(
  rows: VersionStub[],
  releases: Map<string, ReleaseDocument>,
): {id: string; title: string}[] {
  const ids = [...new Set(rows.filter((row) => row.kind === 'release').map((row) => row.bundle))]
  return ids.map((id) => ({
    id,
    title: releases.get(id)?.metadata?.title || toReleaseId(id),
  }))
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
  const searchParams: [string, string][] = row.variantId
    ? [['variant', encodeVariantLinkParam(row.variantId, variantType)]]
    : []
  let perspectiveStack = ['drafts']
  if (row.kind === 'published') {
    perspectiveStack = ['published']
    searchParams.push(['perspective', 'published'])
  } else if (row.kind === 'release') {
    const releaseId = toReleaseId(row.bundle)
    perspectiveStack = [releaseId, 'drafts']
    searchParams.push(['perspective', releaseId])
  }

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
