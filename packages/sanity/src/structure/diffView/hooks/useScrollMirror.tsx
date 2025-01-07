import {useEffect} from 'react'
import ScrollMirror from 'scrollmirror'

/**
 * Use the ScrollMirror library to synchronise the scroll position for an array of elements.
 *
 * @internal
 */
export function useScrollMirror(elements: (HTMLElement | null)[]): void {
  useEffect(() => {
    const existentElements = elements.filter((element) => element !== null)

    if (existentElements.length === 0) {
      return undefined
    }

    const scrollMirror = new ScrollMirror(existentElements)
    return () => scrollMirror.destroy()
  }, [elements])
}
