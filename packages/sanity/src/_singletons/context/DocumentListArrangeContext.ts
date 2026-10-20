import {createContext} from 'sanity/_createContext'

import type {DocumentListArrange} from '../../structure/components/paneItem/DocumentListArrange'

/**
 * PROPOSED (Variants 2.0 test studio). A function that arranges the document list's rows; `null` leaves the list as the query returns it.
 * @internal
 */
export const DocumentListArrangeContext = createContext<DocumentListArrange | null>(
  'sanity/_singletons/context/document-list-arrange',
  null,
)
