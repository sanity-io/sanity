import {useContext} from 'react'
import {type VirtualizerScrollInstance, VirtualizerScrollInstanceContext} from 'sanity/_singleton'

/**
 * @internal
 */
export function useVirtualizerScrollInstance(): VirtualizerScrollInstance {
  const ref = useContext(VirtualizerScrollInstanceContext)
  if (!ref) {
    throw new Error('VirtualizerScrollInstance: missing context value')
  }
  return ref
}
