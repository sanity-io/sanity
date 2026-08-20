import {type ReleaseDocument} from '@sanity/client'

import {sortReleases} from '../../releases/hooks/utils'
import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {readVersionType} from '../../util/versionsUtils'
import {type SystemVariant} from '../../variants/types'

type ReleaseLaneKind = 'published' | 'drafts' | 'release' | 'agent'

const KIND_ORDER: Record<ReleaseLaneKind, number> = {
  published: 0,
  drafts: 1,
  release: 2,
  agent: 3,
}

interface ResolvedVersionBundle {
  id: string
  kind: ReleaseLaneKind
  release?: ReleaseDocument
}

/**
 * @internal
 */
export interface DocumentVersionStatusItem {
  version: VersionInfoDocumentStub
  variant?: SystemVariant
  release?: ReleaseDocument
}

/**
 * @internal
 */
export interface DocumentVersionStatusGroup {
  variantId?: string
  items: DocumentVersionStatusItem[]
}

function bundleSortLabel(bundle: ResolvedVersionBundle): string {
  return bundle.release?.metadata?.title ?? bundle.id
}

function compareResolvedBundles(
  left: ResolvedVersionBundle,
  right: ResolvedVersionBundle,
  sortedReleases: ReleaseDocument[],
): number {
  const kindDelta = KIND_ORDER[left.kind] - KIND_ORDER[right.kind]
  if (kindDelta !== 0) {
    return kindDelta
  }

  if (left.kind === 'release' && right.kind === 'release') {
    const leftIndex = sortedReleases.findIndex((release) => release._id === left.id)
    const rightIndex = sortedReleases.findIndex((release) => release._id === right.id)
    const normalizedLeftIndex = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex
    const normalizedRightIndex = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex

    if (normalizedLeftIndex !== normalizedRightIndex) {
      return normalizedLeftIndex - normalizedRightIndex
    }
  }

  return bundleSortLabel(left).localeCompare(bundleSortLabel(right))
}

function resolveVersionBundle(
  version: VersionInfoDocumentStub,
  releasesById: Map<string, ReleaseDocument>,
): ResolvedVersionBundle {
  switch (readVersionType(version)) {
    case 'release': {
      const releaseRef = version._system.release?._ref
      const release = releaseRef ? releasesById.get(releaseRef) : undefined
      return {id: release?._id ?? releaseRef ?? version._id, kind: 'release', release}
    }
    case 'draft':
      return {id: 'drafts', kind: 'drafts'}
    case 'agent':
      return {id: version._system.bundleId ?? version._id, kind: 'agent'}
    case 'published':
    default:
      return {id: 'published', kind: 'published'}
  }
}

function compareDocumentVersionsForStatus(
  left: VersionInfoDocumentStub,
  right: VersionInfoDocumentStub,
  releasesById: Map<string, ReleaseDocument>,
  sortedReleases: ReleaseDocument[],
): number {
  const leftVariantId = left._system.variant?._ref ?? ''
  const rightVariantId = right._system.variant?._ref ?? ''

  if (leftVariantId !== rightVariantId) {
    if (!leftVariantId) return -1
    if (!rightVariantId) return 1
    return leftVariantId.localeCompare(rightVariantId)
  }

  return compareResolvedBundles(
    resolveVersionBundle(left, releasesById),
    resolveVersionBundle(right, releasesById),
    sortedReleases,
  )
}

/**
 * Groups document versions by variant (default first, then by variant id) and sorts each group
 * published → drafts → releases → agent bundles. Releases follow `sortReleases()`: undecided, then
 * scheduled, then ASAP (each by date descending). Releases missing from that list fall back to title.
 *
 * @internal
 */
export function groupDocumentVersionsForStatus(
  versions: VersionInfoDocumentStub[],
  releases: ReleaseDocument[],
  variantsById: Map<string, SystemVariant>,
): DocumentVersionStatusGroup[] {
  const sortedReleases = sortReleases(releases)
  const releasesById = new Map(sortedReleases.map((release) => [release._id, release]))

  const sortedVersions = versions.toSorted((left, right) =>
    compareDocumentVersionsForStatus(left, right, releasesById, sortedReleases),
  )

  const groups: DocumentVersionStatusGroup[] = []

  for (const version of sortedVersions) {
    const variantId = version._system.variant?._ref
    const lastGroup = groups.at(-1)

    const item: DocumentVersionStatusItem = {
      version,
      variant: variantId ? variantsById.get(variantId) : undefined,
      release: version._system.release?._ref
        ? releasesById.get(version._system.release._ref)
        : undefined,
    }

    if (lastGroup && lastGroup.variantId === variantId) {
      lastGroup.items.push(item)
      continue
    }

    groups.push({
      variantId,
      items: [item],
    })
  }

  return groups
}
