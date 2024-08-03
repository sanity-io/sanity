import type {Path} from '@sanity/types'
import {createContext} from 'sanity/_createContext'

/** @internal */
export const DiffContext = createContext<{
  path: Path
}>('sanity/_singletons/context/diff', {
  path: [],
})
