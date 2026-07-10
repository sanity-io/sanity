/**
 * The target of a list-item context menu: which document row the menu was
 * opened for, and where to anchor it.
 *
 * @internal
 */
export interface PaneItemMenuTarget {
  /** Published ID of the document the menu acts on. */
  documentId: string
  /** Schema type name of the document. */
  documentType: string
  /** The row element the menu popover is positioned relative to. */
  element: HTMLElement
  /**
   * Pointer offset relative to the row element (from the `contextmenu`
   * event), or `null` when opened via keyboard or the row's overflow button
   * (the menu then anchors to the row start).
   */
  translate: {x: number; y: number} | null
}

/**
 * Selection model for a document list pane. Rows enroll through
 * `useDocumentListSelection()`; the same model feeds the bulk action bar and
 * the shared row context menu.
 *
 * @internal
 */
export interface DocumentListSelectionContextValue {
  /** Published IDs of the selected documents, in list order. */
  selectedIds: string[]
  /** Whether the pane is in selection mode (one or more rows selected). */
  selectionActive: boolean
  isSelected: (publishedId: string) => boolean
  /** Toggle a single row in or out of the selection. */
  toggle: (publishedId: string) => void
  /** Extend the selection from the last toggled row to the given row. */
  selectRange: (publishedId: string) => void
  /** Select every loaded row. */
  selectAll: () => void
  clearSelection: () => void
  /** Number of loaded rows (the "select all" universe). */
  itemCount: number
  /** Schema type name for a loaded row, if known. */
  getItemType: (publishedId: string) => string | undefined
  /** The pane's identity (mock agent batches key off it). */
  paneKey: string
  /** The loaded rows as (id, type) pairs, in list order. */
  listItems: Array<{documentId: string; documentType: string}>
  /** The row context menu currently open, if any. */
  itemMenu: PaneItemMenuTarget | null
  openItemMenu: (target: PaneItemMenuTarget) => void
  closeItemMenu: () => void
}
