import type {ReactNode} from 'react'
import {createContext} from 'sanity/_createContext'

import type {DocumentFieldActionNode} from '../../core/config/document/fieldActions/types'
import type {FieldCommentsProps} from '../../core/form/types'

/** @internal */
export interface FieldActionsContextValue {
  actions: DocumentFieldActionNode[]
  __internal_comments?: FieldCommentsProps
  __internal_slot?: ReactNode
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
    // eslint-disable-next-line camelcase
    __internal_slot: undefined,
    // eslint-disable-next-line camelcase
    __internal_comments: undefined,
    onMouseEnter: () => undefined,
    onMouseLeave: () => undefined,
  },
)
