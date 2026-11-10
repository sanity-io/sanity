import type {ReactNode} from 'react'
import {createContext} from 'react'

import type {DocumentFieldActionNode} from '../../core/config/document/fieldActions/types'
import type {FieldCommentsProps} from '../../core/form/types/fieldProps'

/** @internal */
export interface FieldActionsContextValue {
  actions: DocumentFieldActionNode[]
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  __internal_comments?: FieldCommentsProps
  __internal_slot?: ReactNode
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
  __internal_slot: undefined,
  __internal_comments: undefined,
  onMouseEnter: () => undefined,
  onMouseLeave: () => undefined,
})
