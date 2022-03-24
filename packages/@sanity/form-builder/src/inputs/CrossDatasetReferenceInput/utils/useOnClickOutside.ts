// Modified version of https://usehooks.com/useOnClickOutside that can take multiple refs
import {RefObject, useEffect} from 'react'

export function useOnClickOutside(refs: RefObject<HTMLElement>[], handler: (event: Event) => void) {
  useEffect(() => {
    const listener = (event: Event) => {
      const target = event.target
      if (target instanceof HTMLElement) {
        if (refs.some((ref) => ref.current?.contains(target))) {
          return
        }
        handler(event)
      }
    }
    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)
    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [refs, handler])
}
