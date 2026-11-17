import {
  type EditStateFor,
  isGoingToUnpublish,
  isNewDocument,
  isReleaseDocument,
  isReleaseScheduledOrScheduling,
  isSystemBundle,
  type TargetDocumentState,
  type TargetPerspective,
} from 'sanity'

/** @internal */
export interface AddToReleaseShownInput {
  selectedPerspective: TargetPerspective
  targetDocumentState: TargetDocumentState
  displayedId: string | undefined
  ready: boolean
  editState: EditStateFor | null
  /** The archived release the pane shows a document from, if any. */
  historyVersion: string | undefined
}

/**
 * Whether the document pane's banner shows Add to release: a release (or bundle) that is open
 * for edits is selected, and the document, or the selected variant of it, has no version in it.
 * It follows the document panel's banner rules (`DocumentNotInReleaseBanner` and the `create`
 * case of `DocumentNotInVariantBanner` in a release). While it is shown, Add to release is the
 * view's one filled button and the document inventory's Create variant steps down.
 *
 * @internal
 */
export function isAddToReleaseShown(input: AddToReleaseShownInput): boolean {
  const {selectedPerspective, targetDocumentState, displayedId, ready, editState, historyVersion} =
    input

  // Drafts and Published have no Add to release, and an archived release takes no new versions.
  if (isSystemBundle(selectedPerspective) || historyVersion) return false
  // Nothing can be added to a scheduled release: its banners offer no action.
  if (
    isReleaseDocument(selectedPerspective) &&
    isReleaseScheduledOrScheduling(selectedPerspective)
  ) {
    return false
  }

  // The selected variant has no version in the release: the variant banner adds it.
  if (targetDocumentState.status === 'variant-missing') {
    return !targetDocumentState.creatableTarget
  }

  // The base document has no version in the release: the not-in-release banner adds it.
  return (
    targetDocumentState.status === 'ready' &&
    !targetDocumentState.targetDocument &&
    Boolean(displayedId) &&
    ready &&
    isNewDocument(editState) === false &&
    !(editState?.version && isGoingToUnpublish(editState.version))
  )
}
