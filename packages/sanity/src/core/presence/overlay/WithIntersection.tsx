import {type HTMLProps, useEffect, useRef} from 'react'
import {tap} from 'rxjs/operators'

import {type ObservableIntersectionObserver} from './intersectionObserver'

export interface WithIntersectionProps {
  onIntersection: (id: string, entry: IntersectionObserverEntry) => void
  io: ObservableIntersectionObserver
  id: string
}

export const WithIntersection = (props: WithIntersectionProps & HTMLProps<HTMLDivElement>) => {
  const {onIntersection, io, id, ...rest} = props
  const element = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const el = element.current
    if (!el) return undefined
    const subscription = io
      .observe(el)
      .pipe(tap((entry) => onIntersection(id, entry)))
      .subscribe()
    return () => subscription.unsubscribe()
  }, [io, id, onIntersection])
  return <div {...rest} ref={element} />
}
