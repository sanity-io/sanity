import {type RefObject, useContext} from 'react'
import {ArrayItemRootElementContext} from 'sanity/_singletons'

/**
 * Returns a ref holding the root DOM element of the closest array item
 * wrapper, or `null` when not rendered inside an array item.
 *
 * Useful for outside-click handling: interactions anywhere within the array
 * item — including UI rendered by custom `item`/`input` form components around
 * the default input — should not be treated as outside clicks.
 *
 * @internal
 */
export function useArrayItemRootElementRef(): RefObject<HTMLDivElement | null> | null {
  return useContext(ArrayItemRootElementContext)
}
