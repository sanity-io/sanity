import {createContext} from 'react'

export interface LayerContextValue {
  depth: number
  mount: () => () => void
  size: number
}

export const LayerContext = createContext<LayerContextValue | null>(null)
