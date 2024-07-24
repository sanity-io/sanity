import {useContext} from 'react'
import {type ReferenceItemRef, ReferenceItemRefContext} from 'sanity/_singletons'

/**
 * @internal
 */
export function useReferenceItemRef(): ReferenceItemRef {
  const ref = useContext(ReferenceItemRefContext)
  if (!ref) {
    // The input may not always be wrapped in a reference item.
    // For example in the case of a singular reference input.
    // To prevent the function from crashing, default values are returned in such cases.
    return {menuRef: {current: null}, menuButtonRef: {current: null}, containerRef: {current: null}}
  }
  return ref
}
