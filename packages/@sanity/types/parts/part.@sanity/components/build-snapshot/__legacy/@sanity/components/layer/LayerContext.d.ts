/// <reference types="react" />
export interface LayerContextValue {
  depth: number
  mount: () => () => void
  size: number
}
export declare const LayerContext: import('react').Context<LayerContextValue>
