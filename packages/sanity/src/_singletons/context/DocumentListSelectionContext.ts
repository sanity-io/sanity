import {createContext} from 'sanity/_createContext'

import type {DocumentListSelectionContextValue} from '../../structure/panes/documentList/selection/types'

/**
 * Selection model for document list panes (bulk select + row context menu).
 * `null` outside a `DocumentListSelectionProvider`, in which case list items
 * render as plain navigational rows.
 *
 * @internal
 */
export const DocumentListSelectionContext = createContext<DocumentListSelectionContextValue | null>(
  'sanity/_singletons/context/document-list-selection',
  null,
)
