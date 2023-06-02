import {useContext} from 'react'
import {HoveredFieldContext, HoveredFieldContextValue} from './HoveredFieldContext'

/** @internal */
export function useHoveredField(): HoveredFieldContextValue {
  return useContext(HoveredFieldContext)
}
