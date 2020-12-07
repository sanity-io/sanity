/// <reference types="react" />
export interface LayerContextValue {
  zOffset: number
  mount: () => () => void
  size: number
}
export declare const LayerContext: import('react').Context<LayerContextValue>
