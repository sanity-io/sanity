import type {ValidationMarker} from '@sanity/types'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const ValidationContext = createContext<ValidationMarker[]>(
  'sanity/_singletons/context/validation',
  [],
)
