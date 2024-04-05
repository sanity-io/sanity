import {type ReactNode} from 'react'
import {type ReferenceItemRef, ReferenceItemRefContext} from 'sanity/_singletons'

/**
 * @internal
 */
interface ReferenceItemRefProviderProps extends ReferenceItemRef {
  children: ReactNode
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
