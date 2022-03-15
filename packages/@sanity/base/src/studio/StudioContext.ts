import {ThemeColorSchemeKey} from '@sanity/ui'
import {createContext} from 'react'
import {SanitySpace, SanityTool} from '../config'

export interface StudioContextValue {
  scheme: ThemeColorSchemeKey
  setScheme: React.Dispatch<React.SetStateAction<ThemeColorSchemeKey>>
  spaces: SanitySpace[]
  tools: SanityTool[]
}

export const StudioContext = createContext<StudioContextValue | null>(null)
