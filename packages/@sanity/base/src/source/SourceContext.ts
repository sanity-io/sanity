import {createContext} from 'react'
import {SanitySource} from './types'

export const SourceContext = createContext<SanitySource | null>(null)
