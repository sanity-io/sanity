import {useEffect, useState} from 'react'

interface ScrollState {
  /** The scroller the flag was recorded for, so it does not outlive that element */
  element: HTMLElement
  scrolled: boolean
}

/**
 * Whether the content scrolling under a pane's toolbar is scrolled away from its top, which draws
 * the toolbar's bottom border. Scroll events do not bubble, so they are caught on the way down to
 * whichever element scrolls inside the observed one (an editor's scroller, a list, the pane
 * itself). Elements that only scroll sideways are ignored.
 *
 * The flag belongs to the element passed to `setScroller`: when that element unmounts (a collapsed
 * panel) or is replaced, the border is off again until the new one scrolls. To start different
 * content at its top, give the scroller a `key` that names the content, which remounts it.
 */
export function useScrolledFromTop(): {
  scrolled: boolean
  setScroller: (element: HTMLElement | null) => void
} {
  const [element, setElement] = useState<HTMLElement | null>(null)
  const [state, setState] = useState<ScrollState | null>(null)

  useEffect(() => {
    if (!element) return undefined
    // The scroller last seen scrolling vertically still counts once its content stops
    // overflowing: that is when the browser scrolls it back to the top
    let verticalScroller: Element | undefined
    const update = (event: Event) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (target.scrollHeight > target.clientHeight) verticalScroller = target
      if (target !== verticalScroller) return
      setState({element, scrolled: target.scrollTop > 0})
    }
    element.addEventListener('scroll', update, {capture: true, passive: true})
    return () => element.removeEventListener('scroll', update, {capture: true})
  }, [element])

  return {
    scrolled: state !== null && state.element === element && state.scrolled,
    setScroller: setElement,
  }
}
