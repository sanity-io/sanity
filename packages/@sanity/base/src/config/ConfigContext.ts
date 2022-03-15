import {createContext} from 'react'
import {SanityConfig} from './types'

export const ConfigContext = createContext<SanityConfig | null>(null)
