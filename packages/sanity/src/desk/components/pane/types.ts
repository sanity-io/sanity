import {ComponentType, ReactNode} from 'react'
import {Intent} from '../../structureBuilder'

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
 *
 * @hidden
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
 *
 * @hidden
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

export interface _PaneMenuItem {
  type: 'item'
  key: string

  disabled?: boolean | {reason: ReactNode}
  hotkey?: string
  icon: ComponentType | ReactNode
  iconRight?: ComponentType | ReactNode
  intent?: Intent
  onAction: () => void
  renderAsButton: boolean
  selected?: boolean
  title: string
  i18n?: {key: string; ns: string}
  tone?: 'primary' | 'critical' | 'caution' | 'positive'
}

export interface _PaneMenuGroup {
  type: 'group'
  key: string

  disabled?: boolean | {reason: ReactNode}
  expanded: boolean
  icon?: ComponentType | ReactNode
  title?: string
  i18n?: {key: string; ns: string}
  children: _PaneMenuNode[]
  renderAsButton: boolean
}

export interface _PaneMenuDivider {
  type: 'divider'
  key: string
}

export type _PaneMenuNode = _PaneMenuItem | _PaneMenuGroup | _PaneMenuDivider
