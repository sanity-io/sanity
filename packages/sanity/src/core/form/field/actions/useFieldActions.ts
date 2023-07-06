import {useContext} from 'react'
import {FieldActionsContext, FieldActionsContextValue} from './FieldActionsContext'

/** @internal */
export function useFieldActions(): FieldActionsContextValue {
  return useContext(FieldActionsContext)
}
