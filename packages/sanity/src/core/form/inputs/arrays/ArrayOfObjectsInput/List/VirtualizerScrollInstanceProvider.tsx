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
  const {scrollElement, containerElement} = props

  return (
    <VirtualizerScrollInstanceContext.Provider
      value={{scrollElement, containerElement: containerElement}}
    >
      {props.children}
    </VirtualizerScrollInstanceContext.Provider>
  )
}
