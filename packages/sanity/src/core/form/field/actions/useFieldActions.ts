import {useContext} from 'react'

import {FieldActionsContext, type FieldActionsContextValue} from './FieldActionsContext'

/** @internal */
export function useFieldActions(): FieldActionsContextValue {
  return useContext(FieldActionsContext)
}
