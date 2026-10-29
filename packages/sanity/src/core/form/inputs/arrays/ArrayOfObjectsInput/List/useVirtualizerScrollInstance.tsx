import {type RefObject, useContext} from 'react'
import {VirtualizerScrollInstanceContext} from 'sanity/_singletons'

/**
 * @internal
 */
export interface VirtualizerScrollInstance {
  /**
   * The parent that has the overflow scroll
   */
  scrollElement: HTMLElement | null
  /**
   * The container that wraps the array items
   */
  containerElement: RefObject<HTMLElement | null>
}

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
