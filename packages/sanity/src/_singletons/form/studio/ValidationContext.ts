import {createContext} from 'react'
import type {ValidationMarker} from 'sanity'

/**
 * @internal
 */
export const ValidationContext = createContext<ValidationMarker[]>([])
