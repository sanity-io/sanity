import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {type DocumentPresence} from '../../store/presence/types'
import {getVersionFromId} from '../../util/draftUtils'

/**
 * Maps the scope id of every variant-scoped document in a group to the variant document id it
 * belongs to, so a presence location (which only carries a document id) can be attributed to a
 * variant.
 *
 * Variant scope ids are opaque server-generated hashes, so this mapping can only be discovered
 * from the group's version stubs — never computed from the id shape. A scope id that isn't in the
 * returned map therefore means "not a variant of this group as far as this client can see": the
 * base draft/published pair, a release version, or a variant document that hasn't reached the
 * client's stub list yet.
 *
 * @internal
 */
export function getVariantScopeIds(
  documentVersions: readonly VersionInfoDocumentStub[],
): Map<string, string> {
  const scopeIds = new Map<string, string>()

  for (const version of documentVersions) {
    const variantId = version._system.variant?._ref
    if (!variantId) {
      continue
    }

    const scopeId = version._system.scopeId ?? getVersionFromId(version._id)
    if (scopeId) {
      scopeIds.set(scopeId, variantId)
    }

    // A variant-of-published document advertises the id its drafts sibling occupies whether or
    // not that document exists yet. An editor creating that draft variant reports presence at the
    // advertised id before it exists, so its scope has to attribute to the variant as well.
    const draftScopeId = getVersionFromId(version._system.draft?._ref ?? '')
    if (draftScopeId) {
      scopeIds.set(draftScopeId, variantId)
    }
  }

  return scopeIds
}

/**
 * Partitions document presence by variant: an editor is only shown to editors looking at the same
 * variant, and editors of the base document (or of a release version of it) only see each other.
 *
 * Presence is otherwise aggregated across the whole document group — draft, published and release
 * versions of a document are the same content at different points in its lifecycle, so seeing
 * everyone working on it is useful. Variants are not: two variants of a document are different
 * content that happens to share a group, and showing their editors in the same place claims a
 * collision that isn't there.
 *
 * @internal
 */
export function filterPresenceByVariant(options: {
  presence: DocumentPresence[]
  /** The `_id` of the selected variant (`_.variants.<name>`), or `undefined` for the base document. */
  selectedVariantId: string | undefined
  /** Scope id to variant document id, from {@link getVariantScopeIds}. */
  variantScopeIds: ReadonlyMap<string, string>
}): DocumentPresence[] {
  const {presence, selectedVariantId, variantScopeIds} = options

  // Nothing to partition: no variant is selected and the group has no variant documents. Keeps
  // the array identity stable for the (common) case of a studio that doesn't use variants.
  if (!selectedVariantId && variantScopeIds.size === 0) {
    return presence
  }

  return presence.filter((item) => {
    const scopeId = getVersionFromId(item.documentId ?? '')
    const variantId = scopeId ? variantScopeIds.get(scopeId) : undefined
    return variantId === selectedVariantId
  })
}
