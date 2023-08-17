import {RefObject, useEffect} from 'react'

// This is a modified version of https://usehooks.com/useOnClickOutside that can take multiple element refs
// There is currently a bug in the `useClickOutside` hook from @sanity/ui that requires the refs to be passed as
// actual HTML elements instead of mutable refs. This requires the consumer to store elements in component state
// which adds quite a bit of cruft and isn't always feasible
export function useOnClickOutside(
  refs: RefObject<HTMLElement>[],
  handler: (event: Event) => void,
): void {
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
