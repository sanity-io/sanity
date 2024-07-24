import {type ReactNode, useMemo} from 'react'
import {VirtualizerScrollInstanceContext} from 'sanity/_singletons'

import {type VirtualizerScrollInstance} from './useVirtualizerScrollInstance'

/**
 * @internal
 */
interface VirtualizerScrollInstanceProviderProps extends VirtualizerScrollInstance {
  children: ReactNode
}

/**
 *
 * @internal
 */
export function VirtualizerScrollInstanceProvider(props: VirtualizerScrollInstanceProviderProps) {
  const {scrollElement, containerElement} = props

  const value = useMemo(
    () => ({scrollElement, containerElement: containerElement}),
    [containerElement, scrollElement],
  )

  return (
    <VirtualizerScrollInstanceContext.Provider value={value}>
      {props.children}
    </VirtualizerScrollInstanceContext.Provider>
  )
}
