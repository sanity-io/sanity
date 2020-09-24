import React from 'react'
import {TooltipContext} from './tooltipContext'

interface TooltipProviderProps {
  boundaryElement?: HTMLElement | null
  children?: React.ReactNode
}

export function TooltipProvider(props: TooltipProviderProps) {
  const {boundaryElement = null, children} = props

  return <TooltipContext.Provider value={{boundaryElement}}>{children}</TooltipContext.Provider>
}
