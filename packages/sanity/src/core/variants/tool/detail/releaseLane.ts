import {type ReleaseDocument} from '@sanity/client'

import {getReleaseDocumentIdFromReleaseId} from '../../../releases/util/getReleaseDocumentIdFromReleaseId'
import {isPublishedBundleId, isReleaseBundle} from '../util'
import {type DocumentInVariantGroup, type VariantDocumentVersion} from './types'

/**
 * The kind of bundle a variant-scoped document version lives in. Drives the label
 * and tone the release lane / bundle chips render with.
 *
 * @internal
 */
export type ReleaseLaneKind = 'published' | 'drafts' | 'release'

/**
 * Stable filter key for the "all documents" (unfiltered) lane segment.
 *
 * @internal
 */
export const RELEASE_LANE_ALL = 'all'

/**
 * Stable filter key used when a version points at a release that could not be resolved
 * from the active releases store (e.g. an archived release).
 *
 * @internal
 */
export const UNRESOLVED_RELEASE_ID = 'unresolved-release'

/**
 * A resolved bundle descriptor for a single version: a stable id used both as the lane
 * filter key and the chip key, the kind, and the release document when applicable.
 *
 * @internal
 */
export interface ResolvedVersionBundle {
  id: string
  kind: ReleaseLaneKind
  release?: ReleaseDocument
}

/**
 * Resolves a single variant document version to its bundle descriptor.
 *
 * Shared by the release lane (to tally and filter) and the per-row bundle chips
 * (to render), so both agree on what bundle a version belongs to.
 *
 * @internal
 */
export function resolveVersionBundle(
  version: VariantDocumentVersion,
  releasesById: Map<string, ReleaseDocument>,
): ResolvedVersionBundle {
  if (isPublishedBundleId(version.bundleId)) {
    return {id: 'published', kind: 'published'}
  }

  if (version.bundleId === 'drafts') {
    return {id: 'drafts', kind: 'drafts'}
  }

  if (version.releaseRef) {
    const release = releasesById.get(version.releaseRef)
    return {id: release?._id ?? version.releaseRef, kind: 'release', release}
  }

  if (isReleaseBundle(version.bundleId)) {
    const releaseDocumentId = getReleaseDocumentIdFromReleaseId(version.bundleId!)
    const release = releasesById.get(releaseDocumentId)
    return {id: release?._id ?? releaseDocumentId, kind: 'release', release}
  }

  return {id: UNRESOLVED_RELEASE_ID, kind: 'release'}
}

/**
 * The distinct bundle ids a document group participates in (deduped across its versions),
 * so a group counts at most once per lane segment.
 *
 * @internal
 */
function getRowBundleIds(
  row: DocumentInVariantGroup,
  releasesById: Map<string, ReleaseDocument>,
): Set<string> {
  const ids = new Set<string>()
  for (const version of row.versions) {
    ids.add(resolveVersionBundle(version, releasesById).id)
  }
  return ids
}

/**
 * A single release-lane segment: a bundle this variant's documents participate in,
 * with the number of document groups riding on it.
 *
 * @internal
 */
export interface ReleaseLaneSegment {
  id: string
  kind: ReleaseLaneKind
  release?: ReleaseDocument
  count: number
}

function getKindOrder(kind: ReleaseLaneKind): number {
  if (kind === 'published') return 0
  if (kind === 'drafts') return 1
  return 2
}

/**
 * Computes the release lane for a variant detail table: one segment per bundle the
 * documents participate in, ordered published → drafts → releases (by title), each
 * carrying the number of document groups in it.
 *
 * @internal
 */
export function computeReleaseLaneSegments(
  rows: DocumentInVariantGroup[],
  releasesById: Map<string, ReleaseDocument>,
): ReleaseLaneSegment[] {
  const segments = new Map<string, ReleaseLaneSegment>()

  for (const row of rows) {
    for (const version of row.versions) {
      const resolved = resolveVersionBundle(version, releasesById)
      const existing = segments.get(resolved.id)
      if (existing) {
        continue
      }
      segments.set(resolved.id, {...resolved, count: 0})
    }
  }

  // Count each document group once per bundle it appears in.
  for (const row of rows) {
    for (const bundleId of getRowBundleIds(row, releasesById)) {
      const segment = segments.get(bundleId)
      if (segment) {
        segment.count += 1
      }
    }
  }

  return Array.from(segments.values()).toSorted((left, right) => {
    const kindDelta = getKindOrder(left.kind) - getKindOrder(right.kind)
    if (kindDelta !== 0) {
      return kindDelta
    }

    const leftTitle = left.release?.metadata?.title ?? left.id
    const rightTitle = right.release?.metadata?.title ?? right.id
    return leftTitle.localeCompare(rightTitle)
  })
}

/**
 * Whether a document group has any version in the given lane segment.
 *
 * @internal
 */
export function rowMatchesLane(
  row: DocumentInVariantGroup,
  laneId: string,
  releasesById: Map<string, ReleaseDocument>,
): boolean {
  if (laneId === RELEASE_LANE_ALL) {
    return true
  }
  return getRowBundleIds(row, releasesById).has(laneId)
}

/**
 * Builds the rows for the "group by release" (swimlane) view: one collapsible aggregate header
 * per bundle (ordered like the release lane), each followed — when expanded — by the document
 * groups that appear in that bundle. A document that rides several bundles appears under each,
 * matching the lane's counts. Row `groupId`s are a monotonic padded index so the table's default
 * `documentGroup` sort preserves this exact order.
 *
 * @internal
 */
export function buildReleaseSwimlaneRows({
  rows,
  releasesById,
  expanded,
  activeLane = RELEASE_LANE_ALL,
  getSegmentLabel,
  onToggle,
}: {
  rows: DocumentInVariantGroup[]
  releasesById: Map<string, ReleaseDocument>
  expanded: ReadonlySet<string>
  activeLane?: string
  getSegmentLabel: (segment: ReleaseLaneSegment) => string
  onToggle: (segmentId: string) => void
}): DocumentInVariantGroup[] {
  const allSegments = computeReleaseLaneSegments(rows, releasesById)
  // A selected filter tab scopes the swimlanes to just that release group.
  const segments =
    activeLane === RELEASE_LANE_ALL
      ? allSegments
      : allSegments.filter((segment) => segment.id === activeLane)

  const out: DocumentInVariantGroup[] = []
  let index = 0
  const nextRowKey = () => String(index++).padStart(5, '0')

  for (const segment of segments) {
    const isExpanded = expanded.has(segment.id)

    out.push({
      memoKey: `release-agg-${segment.id}`,
      groupId: `release-agg-${segment.id}`,
      rowKey: nextRowKey(),
      isLoading: false,
      document: {
        _id: `release-agg-${segment.id}`,
        _type: '',
        _rev: '',
        _createdAt: '',
        _updatedAt: '',
      },
      validation: {hasError: false, isValidating: false, validation: [], revision: undefined},
      version: {documentId: '', releaseRef: null, updatedAt: ''},
      versions: [],
      isReleaseAggregate: true,
      releaseLabel: getSegmentLabel(segment),
      releaseCount: segment.count,
      isReleaseExpanded: isExpanded,
      onToggleRelease: () => onToggle(segment.id),
    } as unknown as DocumentInVariantGroup)

    if (isExpanded) {
      for (const row of rows) {
        if (rowMatchesLane(row, segment.id, releasesById)) {
          // Keep the real groupId (preview links to it); rowKey makes the duplicated row unique.
          out.push({...row, rowKey: nextRowKey()})
        }
      }
    }
  }

  return out
}

/**
 * A stable sort key for the "Appears in" column: orders rows by the most prominent bundle they
 * appear in (published → drafts → releases), then by release title, so sorting the column groups
 * documents by bundle the same way the release lane orders its segments.
 *
 * @internal
 */
export function getRowBundleSortKey(
  row: DocumentInVariantGroup,
  releasesById: Map<string, ReleaseDocument>,
): string {
  let bestOrder = Number.POSITIVE_INFINITY
  let bestLabel = ''

  for (const version of row.versions) {
    const resolved = resolveVersionBundle(version, releasesById)
    const order = getKindOrder(resolved.kind)
    const label = resolved.release?.metadata?.title ?? resolved.id

    if (order < bestOrder || (order === bestOrder && label.localeCompare(bestLabel) < 0)) {
      bestOrder = order
      bestLabel = label
    }
  }

  return `${bestOrder}:${bestLabel}`
}

/**
 * The most prominent bundle a document group appears in (published → drafts → releases by title),
 * used to badge the document preview with the shared perspective-bar iconography.
 *
 * @internal
 */
export function getPrimaryBundle(
  row: DocumentInVariantGroup,
  releasesById: Map<string, ReleaseDocument>,
): ResolvedVersionBundle | undefined {
  let best: ResolvedVersionBundle | undefined
  let bestOrder = Number.POSITIVE_INFINITY
  let bestLabel = ''

  for (const version of row.versions) {
    const resolved = resolveVersionBundle(version, releasesById)
    const order = getKindOrder(resolved.kind)
    const label = resolved.release?.metadata?.title ?? resolved.id

    if (order < bestOrder || (order === bestOrder && label.localeCompare(bestLabel) < 0)) {
      bestOrder = order
      bestLabel = label
      best = resolved
    }
  }

  return best
}
