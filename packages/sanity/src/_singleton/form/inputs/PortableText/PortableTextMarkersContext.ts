import {createContext} from 'react'

import {type PortableTextMarker} from '../../types/_transitional'

/**
 * @internal
 * @hidden
 */
export const PortableTextMarkersContext = createContext<PortableTextMarker[]>([])
