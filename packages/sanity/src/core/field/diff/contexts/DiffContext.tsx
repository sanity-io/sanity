import {Path} from '@sanity/types'
import {createContext} from 'react'

/** @internal */
export const DiffContext = createContext<{path: Path}>({path: []})
