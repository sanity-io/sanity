import * as React from 'react'
import * as PositionTracker from './PositionTracker'
import shallowEquals from 'shallow-equals'
import {share, mergeMap, filter, tap} from 'rxjs/operators'
import {Subject, Observable} from 'rxjs'
import {fromEvent} from 'rxjs'

export const scroll$ = fromEvent(window, 'scroll', {passive: true, capture: true}).pipe(share())

const createResizeObserver = () => {
  const entries$ = new Subject()
  const resizeObserver = new ResizeObserver(entries => {
    entries.forEach(entry => entries$.next(entry))
  })
  return element => {
    return new Observable((subscriber) => {
      resizeObserver.observe(element)
      subscriber.next()
      return () => {
        console.log('unobserving', element)

        resizeObserver.unobserve(element)
      }
    }).pipe(
      mergeMap(() => entries$.asObservable()),
      tap(console.log),
      filter(entry => entry.target === element),
    )
  }
}

const onResize = createResizeObserver()

export const PresenceTrackerBox = React.memo(function PresenceTrackerBox(props) {
  const ref = React.useRef<HTMLDivElement>()
  const context = React.useContext(PositionTracker.Context)

  const key = React.useMemo(
    () =>
      Math.random()
        .toString(32)
        .substring(2),
    []
  )

  const dispatchUpdate = React.useCallback(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      context.dispatch({
        type: 'update',
        key,
        rect: {top: rect.top, left: rect.left, width: rect.width, height: rect.height}
      })
    }
  })

  React.useEffect(() => {
    const subscription = scroll$.subscribe(dispatchUpdate)
    return () => subscription.unsubscribe()
  })

  React.useEffect(() => {
    if (ref.current) {
      console.log('listening for resize')
      const subscription = onResize(ref.current).subscribe(dispatchUpdate)
      return () => subscription.unsubscribe()
    }
  }, [])

  React.useEffect(() => {
    return () => {
      context.dispatch({type: 'unmount', key})
    }
  }, [])
  React.useEffect(() => {
    dispatchUpdate()
  })
  return <div ref={ref}>Hello I'm a box</div>
}, shallowEquals)
