import {
  useEffect,
  useState,
  useSyncExternalStore,
  useMemo,
  startTransition,
  useCallback,
} from 'react'

function useReducedMotion() {
  const mql = useMemo(
    () =>
      typeof document === 'undefined'
        ? null
        : window.matchMedia('(prefers-reduced-motion: reduce)'),
    []
  )

  return useSyncExternalStore(
    useCallback(
      (onStoreChange) => {
        mql?.addEventListener('change', onStoreChange)
        return () => {
          mql?.removeEventListener('change', onStoreChange)
        }
      },
      [mql]
    ),
    () => mql?.matches,
    () => true
  )
}

export function useLazyFrameloop(ref: React.RefObject<any>) {
  const reduceMotion = useReducedMotion()
  const [frameloop, setFrameloop] = useState<'always' | 'never'>('never')

  useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(
      ([{isIntersecting}]) => {
        startTransition(() => setFrameloop(isIntersecting ? 'always' : 'never'))
      },
      {rootMargin: '0px', threshold: 0}
    )

    observer.observe(ref.current)
    // eslint-disable-next-line consistent-return
    return () => observer.disconnect()
  }, [ref])

  if (reduceMotion && frameloop === 'always') {
    return 'demand'
  }

  return frameloop
}
