import {Flex} from '@sanity/ui'
import {type ReactElement, useEffect, useState} from 'react'

interface ObserveElementProps {
  children: ReactElement
  options?: IntersectionObserverInit
  onIntersectionChange: IntersectionObserverCallback
}

export function ObserveElement(props: ObserveElementProps) {
  const {onIntersectionChange, children, options, ...rest} = props
  const [el, setEl] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!el) return undefined

    const io = new IntersectionObserver(onIntersectionChange, options)
    io.observe(el)

    return () => {
      io.unobserve(el)
      io.disconnect()
    }
  }, [el, onIntersectionChange, options])

  return (
    <Flex ref={setEl} {...rest}>
      {children}
    </Flex>
  )
}
