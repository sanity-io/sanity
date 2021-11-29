import {createContext} from 'react'
import type {TooltipContextValue} from './types'

export const TooltipContext = createContext<TooltipContextValue>({
  boundaryElement: null,
})
