// Modified version of https://usehooks.com/useOnClickOutside that can take multiple refs
import {RefObject, useEffect} from 'react'

export function useOnClickOutside(refs: RefObject<HTMLElement>[], handler) {
  useEffect(() => {
    const listener = (event) => {
      if (refs.some((ref) => ref.current?.contains(event.target))) {
        return
      }
      handler(event)
    }
    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)
    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [refs, handler])
}
