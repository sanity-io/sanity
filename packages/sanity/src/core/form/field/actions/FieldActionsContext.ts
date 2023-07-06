import {MouseEvent, createContext} from 'react'
import {DocumentFieldActionNode} from '../../../config'

/** @internal */
export interface FieldActionsContextValue {
  actions: DocumentFieldActionNode[]
  hovered: boolean
  onMouseEnter: (event: MouseEvent) => void
  onMouseLeave: (event: MouseEvent) => void
}

/** @internal */
export const FieldActionsContext = createContext<FieldActionsContextValue>({
  actions: [],
  hovered: false,
  onMouseEnter: () => undefined,
  onMouseLeave: () => undefined,
})
