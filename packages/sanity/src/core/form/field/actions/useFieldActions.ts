import {useContext} from 'react'
import {FieldActionsContext, type FieldActionsContextValue} from 'sanity/_singletons'

/** @internal */
export function useFieldActions(): FieldActionsContextValue {
  return useContext(FieldActionsContext)
}
