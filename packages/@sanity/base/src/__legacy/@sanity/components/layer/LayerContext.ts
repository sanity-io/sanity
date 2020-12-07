import {createContext} from 'react'

export interface LayerContextValue {
  zOffset: number
  mount: () => () => void
  size: number
}

export const LayerContext = createContext<LayerContextValue | null>(null)
