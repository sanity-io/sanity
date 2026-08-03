import {createContext} from 'sanity/_createContext'

import type {PortableTextMarker} from '../../core/form/types/_transitional'

/**
 * @internal
 */
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export const PortableTextMarkersContext = createContext<PortableTextMarker[]>(
  'sanity/_singletons/context/portable-text-markers',
  [],
)
