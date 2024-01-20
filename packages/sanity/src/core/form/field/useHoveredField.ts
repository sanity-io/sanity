import {useContext} from 'react'

import {HoveredFieldContext, type HoveredFieldContextValue} from './HoveredFieldContext'

/** @internal */
export function useHoveredField(): HoveredFieldContextValue {
  return useContext(HoveredFieldContext)
}
