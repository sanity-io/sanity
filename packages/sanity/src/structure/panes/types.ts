import {type PaneNode} from '../types'

export interface BaseStructureToolPaneProps<T extends PaneNode['type']> {
  paneKey: string
  index: number
  itemId: string
  childItemId?: string
  isSelected?: boolean
  isActive?: boolean
  pane: Extract<PaneNode, {type: T}>
}
