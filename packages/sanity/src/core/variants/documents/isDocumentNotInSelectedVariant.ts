import {type PerspectiveBundle} from '../../perspective/types'
import {type DocumentPerspectiveState} from '../../releases/hooks/useDocumentVersions'
import {getTargetDocument} from '../../util/getTargetDocument'
import {type SystemVariant} from '../types'

/**
 * @internal
 */
export interface IsDocumentNotInSelectedVariantOptions {
  /** Whether the variants beta feature is enabled for the workspace. */
  variantsEnabled: boolean
  /** The currently selected variant, or `undefined` for the default (no variant). */
  selectedVariant: SystemVariant | undefined
  /** The canonical bundle id (`$published`, `drafts` or release id) of the current perspective. */
  bundle: PerspectiveBundle
  /** Document versions (with `system` metadata) from `useDocumentVersions`. */
  documentVersions: Pick<DocumentPerspectiveState, 'versions' | 'loading'>
}

/**
 * Determines whether the open document has no variant-scoped version for the selected variant in
 * the current perspective's bundle. Used to drive the not-in-variant banner, form read-only state,
 * and footer visibility so they stay consistent.
 *
 * Existence is derived entirely from `documentVersions` (the `versionOf` set), so no `editState` is
 * required. Returns `false` (i.e. not blocking) when:
 * - variants are disabled or no variant is selected
 * - document versions are still loading
 * - no versions exist yet (e.g. a new, uncreated document) — it must remain editable so it can be
 *   created; there is nothing for it to be "missing" from
 *
 * Uses exact bundle matching via {@link getTargetDocument} (no fallback to variant-of-published).
 *
 * @internal
 */
export function isDocumentNotInSelectedVariant({
  variantsEnabled,
  selectedVariant,
  bundle,
  documentVersions,
}: IsDocumentNotInSelectedVariantOptions): boolean {
  if (!variantsEnabled || !selectedVariant) {
    return false
  }

  if (documentVersions.loading) {
    return false
  }

  // No documents exist for this group yet (e.g. a new, uncreated document). Keep it editable.
  if (documentVersions.versions.length === 0) {
    return false
  }

  const targetDocument = getTargetDocument({
    bundle,
    variant: selectedVariant._id,
    documentVersions: documentVersions.versions,
  })

  return !targetDocument
}
