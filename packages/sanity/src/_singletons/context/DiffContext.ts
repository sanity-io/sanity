import type {Path} from '@sanity/types'
import {type Context} from 'react'
import {createContext} from 'sanity/_createContext'

/** @internal */
export const DiffContext: Context<{
  path: Path
}> = createContext<{
  path: Path
}>('sanity/_singletons/context/diff', {
  path: [],
})
