import {type MutableRefObject, createContext, useContext} from 'react'

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
  containerElement: MutableRefObject<HTMLElement | null>
}

/**
 * This is used to store the reference to the scroll element for virtualizer
 * @internal
 */
export const VirtualizerScrollInstanceContext = createContext<VirtualizerScrollInstance | null>(
  null
)

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
