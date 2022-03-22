import type {Context} from 'react'
export interface LayerContextValue {
  depth: number
  mount: () => () => void
  size: number
}
export declare const LayerContext: Context<LayerContextValue>
