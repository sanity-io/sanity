import React, {useRef, useLayoutEffect, useEffect} from 'react'

const useIsomorphicEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export function useForwardedRef<T>(ref: React.ForwardedRef<T>): React.MutableRefObject<T | null> {
  const innerRef = useRef<T | null>(null)

  useIsomorphicEffect(() => {
    if (!ref) return

    if (typeof ref === 'function') {
      ref(innerRef.current)
    } else {
      ref.current = innerRef.current
    }
  })

  return innerRef
}
