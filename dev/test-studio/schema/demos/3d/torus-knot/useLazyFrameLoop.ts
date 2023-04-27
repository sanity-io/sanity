import {useEffect, useState, startTransition} from 'react'
import {usePrefersReducedMotion} from '@sanity/ui'

export function useLazyFrameloop(ref: React.RefObject<any>): 'always' | 'demand' | 'never' {
  const reduceMotion = usePrefersReducedMotion()
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
