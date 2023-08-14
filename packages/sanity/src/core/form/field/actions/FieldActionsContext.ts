import {createContext} from 'react'
import {DocumentFieldActionNode} from '../../../config'

/** @internal */
export interface FieldActionsContextValue {
  actions: DocumentFieldActionNode[]
  focused?: boolean
  hovered: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
}

/** @internal */
export const FieldActionsContext = createContext<FieldActionsContextValue>({
  actions: [],
  focused: false,
  hovered: false,
  onMouseEnter: () => undefined,
  onMouseLeave: () => undefined,
})
