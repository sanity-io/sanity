import {useContext} from 'react'
import {HoveredFieldContext, type HoveredFieldContextValue} from 'sanity/_singletons'

/** @internal */
export function useHoveredField(): HoveredFieldContextValue {
  return useContext(HoveredFieldContext)
}
