import {getCreatableVariantTarget, type TargetDocumentState} from '../hooks/useTargetDocumentState'

/**
 * The version a variant's displayed version is compared with for change indicators, or
 * `undefined` when the displayed document is not a variant's draft or published version, so the
 * document id stack decides as for any other document.
 *
 * The id stack layers versions on the base pair, so it reads a variant's version as an anonymous
 * version on top of the base published version. A variant has its own published and draft, though:
 *
 * - the variant's draft compares with the variant's published version, or with nothing when the
 *   variant was never published;
 * - the variant's published version, shown in Drafts until the first edit creates the draft,
 *   compares with nothing, as a published document does.
 *
 * `null` means there is no upstream version.
 *
 * @internal
 */
export function getVariantUpstreamId(
  targetState: TargetDocumentState,
  displayedId: string | undefined,
): string | null | undefined {
  const isVariantTarget =
    (targetState.status === 'ready' && targetState.variant !== undefined) ||
    getCreatableVariantTarget(targetState) !== undefined
  if (!isVariantTarget || !displayedId || targetState.status === 'resolving') {
    return undefined
  }
  if (targetState.status !== 'ready' && targetState.status !== 'variant-missing') {
    return undefined
  }

  const {published, draft} = targetState.siblings
  if (draft && displayedId === draft._id) {
    return published?._id ?? null
  }
  if (published && displayedId === published._id) {
    return null
  }
  // A creatable draft that does not exist yet: the form shows its stand-in under the draft's
  // advertised id (or the group id), and the first edit creates it. That draft compares with the
  // variant's published version, also in the moment before the version stubs list it.
  if (!draft && getCreatableVariantTarget(targetState)) {
    return published?._id ?? null
  }
  return undefined
}
