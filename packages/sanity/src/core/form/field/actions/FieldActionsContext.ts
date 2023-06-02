import {MouseEvent, createContext} from 'react'
import {DocumentFieldActionNode} from '../../../config'

/** @internal */
export interface FieldActionsContextValue {
  actions: DocumentFieldActionNode[]
  focused: boolean
  hovered: boolean
  onMouseEnter: (event: MouseEvent) => void
  onMouseLeave: (event: MouseEvent) => void
}

/** @internal */
export const FieldActionsContext = createContext<FieldActionsContextValue>({
  actions: [],
  focused: false,
  hovered: false,
  onMouseEnter: () => undefined,
  onMouseLeave: () => undefined,
})
