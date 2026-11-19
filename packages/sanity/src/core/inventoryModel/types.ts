import {type ReleaseDocument} from '@sanity/client'

import {type VariantId} from '../variants/types'

/**
 * What kind of version a stub is. `agent` versions belong to an agent bundle (proposed changes).
 *
 * @internal
 */
export type VersionKind = 'published' | 'draft' | 'release' | 'agent'

/**
 * The state a document has for one definition, as one cell of a lens. `absent` means the document
 * has no version for that definition at all.
 *
 * @internal
 */
export type CellState = 'published' | 'draft' | 'release' | 'absent'

/**
 * The smallest description of a stored version that every surface needs: the document list's
 * status icons and popover, the per-document inventory, and the lenses of the Variants tool.
 * Built once from a document stub by {@link toVersionStub}.
 *
 * @internal
 */
export interface VersionStub {
  _id: string
  _type: string
  _updatedAt: string
  /** `_system.group._ref`: the published id of the document the version belongs to. The only grouping key. */
  groupId: string
  /** The variant definition the version belongs to; `undefined` for the Default version. */
  variantId: VariantId | undefined
  kind: VersionKind
  /** `published`, `drafts`, the release document id, or the agent bundle id. */
  bundle: string
  /** Marked for unpublishing inside a release (`_system.delete`). */
  goingToUnpublish: boolean
}

/**
 * Everything the lenses read, indexed once.
 *
 * @internal
 */
export interface InventoryIndex {
  /** Every stub, in the shared version order. */
  versions: VersionStub[]
  /** Stubs per document (group id), each list in the shared version order. */
  byGroup: Map<string, VersionStub[]>
  /** The documents (group ids) that have at least one non-agent version for a definition. */
  groupsByVariant: Map<VariantId, Set<string>>
  /** Ranks a stub in the shared version order; lower comes first. */
  rank: (stub: VersionStub) => number
}

/**
 * Where scheduled drafts (single-document releases) sit in the release order: among the scheduled
 * releases by publish date, or after every other release.
 *
 * @internal
 */
export interface ReleaseOrderOptions {
  scheduledDrafts?: 'byDate' | 'afterReleases'
}

/**
 * Input for {@link buildInventoryIndex}.
 *
 * @internal
 */
export interface InventoryIndexInput extends ReleaseOrderOptions {
  versions: VersionStub[]
  releases: Map<string, ReleaseDocument>
}
