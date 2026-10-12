import {useCallback, useState} from 'react'

/**
 * `useState` for a DOM element that is populated through a callback ref, for an element that is
 * rendered for as long as the component is.
 *
 * React detaches refs when an `<Activity>` boundary hides the component, before the element is
 * removed from the DOM, and attaches them again on reveal. A plain `useState` setter used as the
 * ref would reset to `null` while hidden, and whatever renders from the element would change
 * underneath the preserved tree: a portal moves its content to the fallback element (remounting
 * it twice per hide and show), a virtualizer loses its scroll element and drops its rows. The
 * setter returned here ignores the `null` of a detach, so the element lives as long as the state
 * that holds it.
 *
 * That is also why the element must not be rendered conditionally: a detach looks the same
 * whether the element is being hidden or removed (the node is still connected in both cases), so
 * the state would keep holding an element that is no longer rendered. Replacing the element is
 * fine, since the new node's attach lands in the same commit as the old node's detach and wins.
 *
 * @internal
 */
export function useElementState<T extends Element>(): [T | null, (element: T | null) => void] {
  const [element, setElement] = useState<T | null>(null)
  const setElementRef = useCallback((node: T | null) => {
    if (node) setElement(node)
  }, [])
  return [element, setElementRef]
}
