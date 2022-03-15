import {Path} from '@sanity/types'
import {createContext} from 'react'

export const DiffContext = createContext<{path: Path}>({path: []})
