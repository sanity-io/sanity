import {type VersionInfoDocumentStub} from '../releases/store/types'
import {getVersionFromId} from '../util/draftUtils'
import {getDocumentVersionVariantId} from '../util/getDocumentVersionVariant'
import {readVersionType} from '../util/versionsUtils'
import {type VariantId} from '../variants/types'
import {type InventoryIndex, type InventoryIndexInput, type VersionStub} from './types'
import {createVersionRanker} from './versionOrder'

/**
 * Reduces a document stub to a {@link VersionStub}. Groups by `_system.group`, never by parsing
 * the id, so variant versions (`versions.<scopeId>.<groupId>`) land with their document.
 *
 * @internal
 */
export function toVersionStub(document: VersionInfoDocumentStub): VersionStub | undefined {
  const kind = readVersionType(document)
  const groupId = document._system?.group?._ref
  if (!kind || !groupId) {
    return undefined
  }

  return {
    _id: document._id,
    _type: document._type,
    _updatedAt: document._updatedAt,
    groupId,
    variantId: getDocumentVersionVariantId(document),
    kind,
    bundle: getBundle(document, kind),
    goingToUnpublish: document._system.delete === true,
  }
}

function getBundle(document: VersionInfoDocumentStub, kind: VersionStub['kind']): string {
  switch (kind) {
    case 'published':
      return 'published'
    case 'draft':
      return 'drafts'
    case 'release':
      return document._system.release?._ref ?? document._system.bundleId ?? document._id
    case 'agent':
    default:
      return getVersionFromId(document._id) ?? document._system.bundleId ?? document._id
  }
}

/**
 * Indexes version stubs once, so every lens is a cheap pure function of the result. The Default
 * version comes before variants within a document; otherwise the shared version order applies.
 *
 * @internal
 */
export function buildInventoryIndex({
  versions,
  releases,
  scheduledDrafts,
}: InventoryIndexInput): InventoryIndex {
  const rank = createVersionRanker(releases, {scheduledDrafts})
  const ordered = versions.toSorted(
    (left, right) =>
      rank(left) - rank(right) ||
      Number(Boolean(left.variantId)) - Number(Boolean(right.variantId)) ||
      (left.variantId ?? '').localeCompare(right.variantId ?? ''),
  )

  const byGroup = new Map<string, VersionStub[]>()
  const groupsByVariant = new Map<VariantId, Set<string>>()

  for (const stub of ordered) {
    const groupVersions = byGroup.get(stub.groupId)
    if (groupVersions) {
      groupVersions.push(stub)
    } else {
      byGroup.set(stub.groupId, [stub])
    }

    // Agent versions are proposed changes, which every lens leaves out by default, so they do not
    // make a document present for a definition (cellState has no state for them).
    if (stub.variantId && stub.kind !== 'agent') {
      const groups = groupsByVariant.get(stub.variantId)
      if (groups) {
        groups.add(stub.groupId)
      } else {
        groupsByVariant.set(stub.variantId, new Set([stub.groupId]))
      }
    }
  }

  return {versions: ordered, byGroup, groupsByVariant, rank}
}
