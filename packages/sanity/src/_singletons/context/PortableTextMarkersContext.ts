import {type Context} from 'react'
import {createContext} from 'sanity/_createContext'

import type {PortableTextMarker} from '../../core/form/types/_transitional'

/**
 * @internal
 */
export const PortableTextMarkersContext: Context<PortableTextMarker[]> = createContext<
  PortableTextMarker[]
>('sanity/_singletons/context/portable-text-markers', [])
