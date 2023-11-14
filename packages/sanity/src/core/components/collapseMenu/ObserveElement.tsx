import {Flex} from '@sanity/ui'
import React, {useEffect, useState} from 'react'

interface ObserveElementProps {
  children: React.ReactElement
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
