import {useContext} from 'react'
import {FieldActionsContext, type FieldActionsContextValue} from 'sanity/_singleton'

/** @internal */
export function useFieldActions(): FieldActionsContextValue {
  return useContext(FieldActionsContext)
}
