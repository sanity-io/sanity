import type {Path} from '@sanity/types'
import {createContext} from 'sanity/_createContext'

/** @internal */
export const DiffContext: React.Context<{
  path: Path
}> = createContext('sanity/_singletons/context/diff', {
  path: [],
})
