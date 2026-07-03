import {type PerspectiveBundle} from '../../perspective/types'
import {type DocumentPerspectiveState} from '../../releases/hooks/useDocumentVersions'
import {getTargetDocument} from '../../util/getTargetDocument'
import {type SystemVariant} from '../types'

/**
 * @internal
 */
export interface IsDocumentInSelectedVariantOptions {
  /** The currently selected variant. */
  selectedVariant: SystemVariant
  /** The canonical bundle id (`published`, `drafts` or release id) of the current perspective. */
  bundle: PerspectiveBundle
  /** Document versions (with `system` metadata) from `useDocumentVersions`. */
  documentVersions: DocumentPerspectiveState['versions']
}

/**
 * Determines whether the open document has a variant-scoped version for the selected variant in
 * the current perspective's bundle.
 *
 *
 * @internal
 */
export function isDocumentInSelectedVariant({
  selectedVariant,
  bundle,
  documentVersions,
}: IsDocumentInSelectedVariantOptions): boolean {
  const targetDocument = getTargetDocument({
    bundle,
    variant: selectedVariant._id,
    documentVersions,
  })

  return Boolean(targetDocument)
}
