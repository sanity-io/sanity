import {createContext} from 'sanity/_createContext'

import type {DocumentFieldActionNode} from '../../core/config/document/fieldActions/types'

/** @internal */
export interface FieldActionsContextValue {
  actions: DocumentFieldActionNode[]
  focused?: boolean
  hovered: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
}

/** @internal */
export const FieldActionsContext = createContext<FieldActionsContextValue>(
  'sanity/_singletons/context/field-actions',
  {
    actions: [],
    focused: false,
    hovered: false,
    onMouseEnter: () => undefined,
    onMouseLeave: () => undefined,
  },
)
