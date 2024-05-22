import {type ForwardedRef, type MutableRefObject, useEffect, useLayoutEffect, useRef} from 'react'

const useIsomorphicEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export function useForwardedRef<T>(ref: ForwardedRef<T>): MutableRefObject<T | null> {
  const innerRef = useRef<T | null>(null)

  useIsomorphicEffect(() => {
    if (!ref) return

    if (typeof ref === 'function') {
      ref(innerRef.current)
    } else {
      // eslint-disable-next-line react-compiler/react-compiler
      ref.current = innerRef.current
    }
  })

  return innerRef
}
