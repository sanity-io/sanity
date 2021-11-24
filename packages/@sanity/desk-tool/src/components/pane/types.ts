/**
 * @internal
 */
export interface PaneData {
  element: HTMLElement
  collapsed: boolean
  currentMinWidth: number
  currentMaxWidth: number
  flex: number
}

/**
 * @beta
 */
export interface PaneContextValue {
  collapse: () => void
  collapsed: boolean
  expand: () => void
  index?: number
  isLast: boolean
  rootElement: HTMLDivElement | null
}

/**
 * @internal
 */
export interface PaneResizeData {
  currentMinWidth: number
  currentMaxWidth: number
  flex: number
}

/**
 * @internal
 */
export interface PaneConfigOpts {
  currentMinWidth?: number
  currentMaxWidth?: number
  flex: number
  minWidth?: number
  maxWidth?: number
}

/**
 * @internal
 */
export interface PaneConfig {
  element: HTMLElement
  opts: PaneConfigOpts
}

/**
 * @beta
 */
export interface PaneLayoutContextValue {
  collapse: (element: HTMLElement) => void
  collapsed?: boolean
  expand: (element: HTMLElement) => void
  mount: (element: HTMLElement, opts: PaneConfigOpts) => () => void
  resize: (type: 'start' | 'move' | 'end', element: HTMLElement, deltaX: number) => void
  panes: PaneData[]
}

/**
 * @internal
 */

export interface PaneResizeCache {
  left: {element: HTMLElement; flex: number; width: number}
  right: {element: HTMLElement; flex: number; width: number}
}
