/**
 * The document the user currently has selected, as far as the perspective bar is
 * concerned.
 *
 * `documentType` has no reader yet. It is carried because the follow-up work —
 * the surgical per-version delete on the dropdown rows — needs it for
 * `DiscardVersionDialog`, and because widening this type later would mean
 * touching every writer. Do not remove it as dead.
 *
 * @internal
 */
export interface ActiveDocument {
  /**
   * Either a published/group id or a version id. Consumers pass it straight to
   * `useDocumentVersions`, which normalizes with `getPublishedId` itself.
   */
  documentId: string
  documentType: string
}

/**
 * @internal
 */
export interface PerspectiveActiveDocumentContextValue {
  activeDocument: ActiveDocument | null
  setActiveDocument: (document: ActiveDocument | null) => void
}
