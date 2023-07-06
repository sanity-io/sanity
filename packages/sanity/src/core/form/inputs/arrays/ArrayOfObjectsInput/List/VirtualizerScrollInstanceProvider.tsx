import React from 'react'
import {
  type VirtualizerScrollInstance,
  VirtualizerScrollInstanceContext,
} from './useVirtualizerScrollInstance'

/**
 * @internal
 */
interface VirtualizerScrollInstanceProviderProps extends VirtualizerScrollInstance {
  children: React.ReactNode
}

/**
 *
 * @internal
 */
export function VirtualizerScrollInstanceProvider(props: VirtualizerScrollInstanceProviderProps) {
  const {scrollElement} = props

  return (
    <VirtualizerScrollInstanceContext.Provider value={{scrollElement}}>
      {props.children}
    </VirtualizerScrollInstanceContext.Provider>
  )
}
