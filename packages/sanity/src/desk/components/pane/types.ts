/**
 * @internal
 */
export interface PaneData {
  element: HTMLElement
  collapsed: boolean
  currentMinWidth?: number
  currentMaxWidth?: number
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
  flex: number
  width: number
}

/**
 * @internal
 */
export interface PaneConfigOpts {
  currentMinWidth?: number
  currentMaxWidth?: number
  flex: number
  id: string
  minWidth?: number
  maxWidth?: number
}

/**
 * @beta
 */
export interface PaneLayoutContextValue {
  collapse: (element: HTMLElement) => void
  collapsed?: boolean
  expand: (element: HTMLElement) => void
  expandedElement: HTMLElement | null
  mount: (element: HTMLElement, opts: PaneConfigOpts) => () => void
  resize: (type: 'start' | 'move' | 'end', element: HTMLElement, deltaX: number) => void
  resizing: boolean
  panes: PaneData[]
}

/**
 * @internal
 */

export interface PaneResizeCache {
  left: {element: HTMLElement; flex: number; width: number}
  right: {element: HTMLElement; flex: number; width: number}
}
