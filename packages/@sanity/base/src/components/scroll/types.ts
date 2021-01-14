export type ScrollEventHandler = (event: Event) => void

export interface ScrollContextValue {
  onScroll?: ScrollEventHandler
}
