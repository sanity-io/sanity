import type {ValidationMarker} from '@sanity/types'
import {type Context} from 'react'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const ValidationContext: Context<ValidationMarker[]> = createContext<ValidationMarker[]>(
  'sanity/_singletons/context/validation',
  [],
)
