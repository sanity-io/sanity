import {createContext} from 'react'
import type {PortableTextMarker} from 'sanity'

/**
 * @internal
 */
export const PortableTextMarkersContext = createContext<PortableTextMarker[]>([])
