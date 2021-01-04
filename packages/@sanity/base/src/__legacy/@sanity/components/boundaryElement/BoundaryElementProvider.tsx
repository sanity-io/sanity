import React from 'react'
import {BoundaryElementContext} from './BoundaryElementContext'

export function BoundaryElementProvider({
  children,
  element,
}: {
  children?: React.ReactNode
  element: HTMLElement | null
}) {
  return (
    <BoundaryElementContext.Provider value={element}>{children}</BoundaryElementContext.Provider>
  )
}
