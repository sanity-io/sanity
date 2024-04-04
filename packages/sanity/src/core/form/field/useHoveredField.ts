import {useContext} from 'react'
import {HoveredFieldContext, type HoveredFieldContextValue} from 'sanity/_singleton'

/** @internal */
export function useHoveredField(): HoveredFieldContextValue {
  return useContext(HoveredFieldContext)
}
