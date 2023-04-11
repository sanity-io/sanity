import {createContext, type MutableRefObject, useContext} from 'react'

/**
 * @internal
 */
export interface ReferenceItemRef {
  menuRef: MutableRefObject<HTMLDivElement | null>
  containerRef: MutableRefObject<HTMLDivElement | null>
}

/**
 * This is a way to store ref of the menu as well as the container of the ReferenceItem
 * so it can be used down the tree for clickOutside handling
 * @internal
 */
export const ReferenceItemRefContext = createContext<ReferenceItemRef | null>(null)

/**
 * @internal
 */
export function useReferenceItemRef(): ReferenceItemRef {
  const ref = useContext(ReferenceItemRefContext)
  if (!ref) {
    // The input may not always be wrapped in a reference item.
    // For example in the case of a singular reference input.
    // To prevent the function from crashing, default values are returned in such cases.
    return {menuRef: {current: null}, containerRef: {current: null}}
  }
  return ref
}
