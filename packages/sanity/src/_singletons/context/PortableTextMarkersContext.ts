import type {PortableTextMarker} from '../../core/form/types/_transitional'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const PortableTextMarkersContext = createContext<PortableTextMarker[]>(
  'sanity/_singletons/context/portable-text-markers',
  [],
)
