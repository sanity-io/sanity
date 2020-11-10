import {createContext} from 'react'
import {TooltipContextValue} from './types'

export const TooltipContext = createContext<TooltipContextValue>({
  boundaryElement: null,
})
