import {use} from 'react'
import {HoveredFieldContext, type HoveredFieldContextValue} from 'sanity/_singletons'

/** @internal */
export function useHoveredField(): HoveredFieldContextValue {
  return use(HoveredFieldContext)
}
