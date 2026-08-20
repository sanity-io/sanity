import type {Path} from '@sanity/types'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const PortableTextInputPathContext = createContext<Path>(
  'sanity/_singletons/context/portable-text-input-path',
  [],
)
