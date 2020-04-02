import * as React from 'react'
import {merge, of, ReplaySubject, Subject} from 'rxjs'
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  mergeMap,
  publishReplay,
  refCount,
  scan,
  share,
  takeUntil,
  tap,
  withLatestFrom
} from 'rxjs/operators'
import {createResizeObserver, ObservableResizeObserver} from './resizeObserver'
import {BoxEvent, BoxMountEvent, BoxUnmountEvent, BoxUpdateEvent, Context} from './context'
import {OverlayItem, Rect} from './types'

function isId<T extends {id: string}>(id: string) {
  return (event: T) => event.id === id
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

const getOffsetsTo = (source, target) => {
  let el = source
  let top = 0
  let left = 0
  while (el && el !== target) {
    top += el.offsetTop
    left += el.offsetLeft
    el = el.offsetParent
  }
  return {top, left}
}

function getRelativeRect(element, parent): Rect {
  return {
    ...getOffsetsTo(element, parent),
    width: element.offsetWidth,
    height: element.offsetHeight
  }
}

export const Tracker = React.memo(function Tracker(props: {
  component: React.ComponentType<{
    items: OverlayItem[]
    children: React.ReactNode
    trackerRef: React.RefObject<HTMLElement>
  }>
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  const trackerRef = React.useRef<HTMLElement>()
  const [items, setItems] = React.useState([])

  const boxElementEvents$: Subject<BoxEvent> = React.useMemo(
    () => new ReplaySubject<BoxEvent>(),
    []
  )

  React.useEffect(() => {
    const resizeObserver: ObservableResizeObserver = createResizeObserver()

    const trackerBounds$ = resizeObserver
      .observe(trackerRef.current)
      .pipe(publishReplay(1), refCount())

    const all$ = boxElementEvents$.pipe(share())

    const mounts$ = all$.pipe(filter((ev): ev is BoxMountEvent => ev.type === 'mount'))
    const updates$ = all$.pipe(filter((ev: BoxEvent): ev is BoxUpdateEvent => ev.type === 'update'))
    const unmounts$ = all$.pipe(filter((ev): ev is BoxUnmountEvent => ev.type === 'unmount'))

    const positions$ = mounts$.pipe(
      mergeMap((mountEvent: BoxMountEvent, i) => {
        const elementId = mountEvent.id
        const unmounted$ = unmounts$.pipe(filter(isId(elementId)), share())
        const elementUpdates$ = updates$.pipe(filter(isId(elementId)), share())

        return merge(
          trackerBounds$.pipe(
            map(() => ({
              type: 'update',
              id: elementId,
              rect: getRelativeRect(mountEvent.element, trackerRef.current)
            }))
          ),
          elementUpdates$.pipe(
            map(update => ({
              type: 'update',
              id: elementId,
              props: update.props,
              rect: getRelativeRect(mountEvent.element, trackerRef.current)
            }))
          ),
          unmounted$.pipe(map(() => ({type: 'remove', id: elementId, children: null, rect: null})))
        )
      }),
      scan((items, event: any) => {
        if (event.type === 'update') {
          const exists = items.some(item => item.id === event.id)
          if (exists) {
            return items.map(item =>
              item.id === event.id
                ? {id: event.id, props: event.props || item.props, rect: event.rect || item.rect}
                : item
            )
          }
          return items.concat({
            id: event.id,
            rect: event.rect,
            props: event.props
          })
        }

        if (event.type === 'remove') {
          console.log('remove!', event.id)
          // todo: it would be better to keep track of elements a little while after their elements actually
          // unmounts. this will make it possible to support fade out transitions and also animate components
          // where the react reconciliation decides the most effective thing to do is to unmount and remount the
          // component
          // return items
          return items.filter(item => item.id !== event.id)
        }
        return items
      }, []),
      map(items => items.filter(item => item.rect)),
      distinctUntilChanged(),
      debounceTime(100)
    )
    const sub = positions$.pipe(tap(setItems)).subscribe()
    return () => sub.unsubscribe()
  }, [])

  const dispatch = React.useCallback(event => {
    boxElementEvents$.next(event)
  }, [])

  const Component = props.component
  return (
    <Context.Provider value={{dispatch}}>
      <Component items={items} trackerRef={trackerRef}>
        {props.children}
      </Component>
    </Context.Provider>
  )
})
