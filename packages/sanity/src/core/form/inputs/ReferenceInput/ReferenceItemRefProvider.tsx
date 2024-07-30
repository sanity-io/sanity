import {type ReactNode, useMemo} from 'react'
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
  const {menuRef, menuButtonRef, containerRef} = props
  const value = useMemo(
    () => ({menuRef, menuButtonRef, containerRef}),
    [containerRef, menuButtonRef, menuRef],
  )

  return (
    <ReferenceItemRefContext.Provider value={value}>
      {props.children}
    </ReferenceItemRefContext.Provider>
  )
}
