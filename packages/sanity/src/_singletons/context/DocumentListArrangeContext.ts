import {createContext} from 'react'

import type {DocumentListArrange} from '../../structure/components/paneItem/DocumentListArrange'

/**
 * PROPOSED (Variants 2.0 test studio). A function that arranges the document list's rows; `null` leaves the list as the query returns it.
 * @internal
 */
export const DocumentListArrangeContext = createContext<DocumentListArrange | null>(null)
