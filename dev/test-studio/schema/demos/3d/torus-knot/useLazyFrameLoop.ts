import {useEffect, useState, startTransition} from 'react'

export function useLazyFrameloop(ref: React.RefObject<any>) {
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

  return frameloop
}
