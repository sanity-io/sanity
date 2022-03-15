import {createContext} from 'react'
import {SanitySource} from './types'

export const SourcesContext = createContext<SanitySource[]>([])
