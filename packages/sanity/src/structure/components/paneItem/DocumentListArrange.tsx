import {type ReactNode, useContext, useMemo} from 'react'
import {DocumentListArrangeContext} from 'sanity/_singletons'

import {type DocumentListPaneItem} from '../../panes/documentList/types'

/**
 * PROPOSED (Variants 2.0 test studio, branch explorations/variants-2-0-studio; not in stock Studio).
 *
 * An extension point on the document list itself: the host may reorder the rows and insert section rows between them.
 * The Variants 2.0 C3 option D groups the list by whether a document has a variant for the chosen perspective
 * ("Has variant", "No variant for this perspective"). Stock Studio only renders the list in the order the query returns.
 *
 * The host provides a plain function, built from its own state (the perspective, the documents' variants) in a component of its own, so the
 * list needs no hook or component from the host. A section is an item with `_type === DOCUMENT_LIST_SECTION_TYPE`; the list asks
 * `renderSection` to draw it (a section row is as tall as a document row). With no provider the list is unchanged.
 *
 * @internal
 */
export const DOCUMENT_LIST_SECTION_TYPE = '__document-list-section'

/** @internal */
export interface DocumentListArrangement {
  /** The rows to show, in order: the originals and any section rows. */
  items: DocumentListPaneItem[]
  /** Draws a section row. */
  renderSection: (item: DocumentListPaneItem) => ReactNode
}

/** @internal Returns `undefined` to leave the list as it is. */
export type DocumentListArrange = (
  items: DocumentListPaneItem[],
) => DocumentListArrangement | undefined

/** @internal Provide a function to reorder the document list and add section rows. */
export const DocumentListArrangeProvider = DocumentListArrangeContext.Provider

/** @internal */
export function useDocumentListArrange(
  items: DocumentListPaneItem[],
): DocumentListArrangement | undefined {
  const arrange = useContext(DocumentListArrangeContext)
  return useMemo(() => arrange?.(items), [arrange, items])
}
