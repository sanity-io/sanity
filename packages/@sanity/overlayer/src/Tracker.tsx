import * as React from 'react'
import {
  animationFrameScheduler,
  combineLatest,
  concat,
  merge,
  NEVER,
  of,
  ReplaySubject,
  Subject
} from 'rxjs'
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  mapTo,
  mergeMap,
  mergeMapTo,
  observeOn,
  scan,
  share,
  skip,
  take,
  takeUntil,
  takeWhile,
  tap,
  withLatestFrom
} from 'rxjs/operators'
import {createResizeObserver, ObservableResizeObserver} from './resizeObserver'
import {Overlay} from './Overlay'
import {BoxEvent, BoxMountEvent, BoxUnmountEvent, BoxUpdateEvent, Context} from './context'
import {createIntersectionObserver, ObservableIntersectionObserver} from './intersectionObserver'
import {OverlayItem, Rect} from './types'

function isId<T extends {id: string}>(id: string) {
  return (event: T) => event.id === id
}

interface BoxIntersectionEvent {
  type: 'intersection'
  id: string
  entry: IntersectionObserverEntry
}

interface BoxResizeEvent {
  type: 'resize'
  id: string
  entry: ResizeObserverEntry
}

interface ContainerResizeEvent {
  type: 'containerResize'
  rect: Rect
}

const boundsToRect = (bounds: DOMRect): Rect => ({
  left: bounds.left,
  top: bounds.top,
  height: bounds.height,
  width: bounds.width
})

const isRectEqual = (rect, otherRect) => {
  if (rect === otherRect) {
    return true
  }
  if ((rect && !otherRect) || (!rect && otherRect)) {
    return false
  }
  return (
    rect.top === otherRect.top &&
    rect.left === otherRect.left &&
    rect.height === otherRect.height &&
    rect.width === otherRect.width
  )
}

export const Tracker = React.memo(function Tracker(props: {
  renderWith: React.ComponentType<{items: OverlayItem[]}>
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  const trackerRef = React.useRef()
  const [items, setItems] = React.useState([])

  const boxElementEvents$: Subject<BoxEvent> = React.useMemo(
    () => new ReplaySubject<BoxEvent>(),
    []
  )

  React.useEffect(() => {
    const resizeObserver: ObservableResizeObserver = createResizeObserver()

    const trackerBounds$ = resizeObserver.observe(trackerRef.current).pipe(
      debounceTime(100, animationFrameScheduler),
      map(e => boundsToRect(e.target.getBoundingClientRect())),
      share()
    )

    const all$ = boxElementEvents$.pipe(share())

    const mounts$ = all$.pipe(filter((ev): ev is BoxMountEvent => ev.type === 'mount'))
    const updates$ = all$.pipe(filter((ev): ev is BoxUpdateEvent => ev.type === 'update'))
    const unmounts$ = all$.pipe(filter((ev): ev is BoxUnmountEvent => ev.type === 'unmount'))

    const positions$ = mounts$.pipe(
      mergeMap((mountEvent: BoxMountEvent) => {
        console.log('mount', mountEvent.id)
        const contentRect$ = merge(
          trackerBounds$.pipe(
            debounceTime(100, animationFrameScheduler),
            map(() => boundsToRect(mountEvent.element.getBoundingClientRect())),

            withLatestFrom(trackerBounds$),
            map(([elementBounds, containerBounds]) => ({
              top: elementBounds.top - containerBounds.top,
              left: elementBounds.left - containerBounds.left,
              width: elementBounds.width,
              height: elementBounds.height
            }))
          )
        ).pipe(
          distinctUntilChanged(isRectEqual),
          takeUntil(unmounts$.pipe(filter(isId(mountEvent.id))))
        )
        return contentRect$.pipe(map(rect => ({type: 'update', id: mountEvent.id, rect})))
      }),
      scan((items, event) => {
        if (event.type === 'update') {
          const exists = items.some(item => item.id === event.id)
          if (exists) {
            return items.map(item =>
              item.id === event.id ? {id: event.id, rect: event.rect} : item
            )
          }
          return items.concat({
            id: event.id,
            rect: event.rect
          })
        }
        if (event.type === 'remove') {
          // todo: it would be better to keep track of elements a little while after their elements actually
          // unmounts. this will make it possible to support fade out transitions and also animate components
          // where the react reconciliation decides the most effective thing to do is to unmount and remount the
          // component
          // For now: keep all elements around
          return items
          // return items.filter(item => item.id !== event.id)
        }
        return items
      }, []),
      debounceTime(100, animationFrameScheduler),
      map(items => items.filter(item => item.rect)),
      distinctUntilChanged(),
      tap(console.log)
    )
    const sub = positions$.pipe(tap(setItems)).subscribe()
    return () => sub.unsubscribe()
  }, [])

  const dispatch = React.useCallback(event => {
    boxElementEvents$.next(event)
  }, [])

  return (
    <Context.Provider value={{dispatch}}>
      <div style={{position: 'relative', width: '100%', height: '100%'}}>
        <div ref={trackerRef}>{props.children}</div>
        <Overlay items={items} renderWith={props.renderWith} />
      </div>
    </Context.Provider>
  )
})
