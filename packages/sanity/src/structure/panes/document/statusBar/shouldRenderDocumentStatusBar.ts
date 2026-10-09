import {
  type EditStateFor,
  getCreatableVariantTarget,
  isPublishedPerspective,
  isReleaseDocument,
  type TargetDocumentState,
  type TargetPerspective,
} from 'sanity'

export interface DocumentStatusBarVisibilityInput {
  editState: EditStateFor | null
  targetDocumentState: TargetDocumentState
  selectedPerspective: TargetPerspective
  /** The default (first) selected variant name, if any. */
  selectedVariantName: string | undefined
  /** Whether the pane is showing a historical revision (`params.rev`). */
  showingRevision: boolean
  revisionNotFound: boolean
}

/**
 * Whether the document pane footer (status line, badges and actions — including the
 * "Manage versions" action that opens the document group inventory) renders for the current
 * pane state. Pure, so the hint in the pane header and the footer itself can share it.
 */
export function shouldRenderDocumentStatusBar(input: DocumentStatusBarVisibilityInput): boolean {
  const {
    editState,
    targetDocumentState,
    selectedPerspective,
    selectedVariantName,
    showingRevision,
    revisionNotFound,
  } = input

  // The footer is not rendered at all for a revision that could not be loaded.
  if (showingRevision && revisionNotFound) {
    return false
  }

  const isReady = Boolean(editState?.ready)

  // Hide the footer (status + actions) when a variant is requested but its target document has
  // not resolved to an editable version (missing, invalid selection, or mid-transition).
  // Mirrors the not-in-variant banner and read-only form state. Exception: a creatable missing
  // draft variant is editable (typing creates it), so the footer renders like the base
  // published-with-no-draft experience.
  if (
    selectedVariantName &&
    targetDocumentState.status !== 'ready' &&
    !getCreatableVariantTarget(targetDocumentState)
  ) {
    return false
  }

  // Prefer `targetDocument` so published / release variants (which are not always present on
  // `editState.published`) still render the footer.
  const hasTargetDocument =
    targetDocumentState.status === 'ready' && Boolean(targetDocumentState.targetDocument)
  if (hasTargetDocument) {
    return isReady
  }

  if (selectedPerspective) {
    if (isPublishedPerspective(selectedPerspective)) {
      return isReady && Boolean(editState?.published)
    }
    if (isReleaseDocument(selectedPerspective)) {
      return isReady && Boolean(editState?.version)
    }
  }

  return isReady
}
