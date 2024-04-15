import {createContext} from 'react'

import type {PortableTextMarker} from '../../../../../core/form/types/_transitional'

/**
 * @internal
 */
export const PortableTextMarkersContext = createContext<PortableTextMarker[]>([])
