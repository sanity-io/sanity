import {useEffect, useState} from 'react'
import {Flex} from 'ui5'

interface ObserveElementProps {
  children: React.JSX.Element
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
    <Flex {...rest} ref={setEl}>
      {children}
    </Flex>
  )
}
