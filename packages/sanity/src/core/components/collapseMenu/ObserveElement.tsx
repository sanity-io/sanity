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
    const target = el?.closest('[data-ui="Flex"]')
    if (!target) return undefined

    const io = new IntersectionObserver(onIntersectionChange, options)
    io.observe(target)

    return () => {
      io.unobserve(target)
      io.disconnect()
    }
  }, [el, onIntersectionChange, options])

  return (
    <Flex {...rest}>
      {children}
      <div hidden ref={setEl} />
    </Flex>
  )
}
