/** @internal */
export type ScrollEventHandler = (event: Event) => void

/** @internal */
export interface ScrollContextValue {
  onScroll?: ScrollEventHandler
}
