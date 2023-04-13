import React from 'react'
import {type ReferenceItemRef, ReferenceItemRefContext} from './useReferenceItemRef'

/**
 * @internal
 */
interface ReferenceItemRefProviderProps extends ReferenceItemRef {
  children: React.ReactNode
}

/**
 *
 * @internal
 */
export function ReferenceItemRefProvider(props: ReferenceItemRefProviderProps) {
  const {menuRef, containerRef} = props

  return (
    <ReferenceItemRefContext.Provider value={{menuRef, containerRef}}>
      {props.children}
    </ReferenceItemRefContext.Provider>
  )
}
