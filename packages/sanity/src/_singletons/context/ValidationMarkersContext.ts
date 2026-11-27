import type {ValidationMarker} from '@sanity/types'
import {createContext} from 'react'

/**
 * @internal
 */
export const ValidationMarkersContext = createContext<ValidationMarker[]>([])
