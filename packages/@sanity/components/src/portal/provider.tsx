import React from 'react'
import {PortalContext} from './context'

interface PortalProviderProps {
  children: React.ReactNode
  element: HTMLElement
}

export function PortalProvider(props: PortalProviderProps) {
  return (
    <PortalContext.Provider value={{element: props.element}}>
      {props.children}
    </PortalContext.Provider>
  )
}
