import type {ReactNode} from 'react'
// eslint-disable-next-line no-restricted-imports
import type {FieldCommentsProps} from 'sanity'
import {createContext} from 'sanity/_createContext'

import type {DocumentFieldActionNode} from '../../core/config/document/fieldActions/types'

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
