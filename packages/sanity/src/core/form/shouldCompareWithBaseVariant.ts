import {getCreatableVariantTarget, type TargetDocumentState} from '../hooks/useTargetDocumentState'

/**
 * Whether the form compares its values with the base (Default) document to mark the fields that
 * differ.
 *
 * A resolved variant version is compared, and so is a published variant viewed in Drafts before
 * its draft exists: the form shows the published variant there, and the first edit creates the
 * draft, which is compared with the same base. Without this the marks would only appear after the
 * first keystroke. A historical revision is never compared.
 *
 * @internal
 */
export function shouldCompareWithBaseVariant(
  targetState: TargetDocumentState,
  isOlderRevision: boolean | undefined,
): boolean {
  if (isOlderRevision) return false
  if (targetState.status === 'ready') return targetState.variant !== undefined
  return getCreatableVariantTarget(targetState) !== undefined
}
