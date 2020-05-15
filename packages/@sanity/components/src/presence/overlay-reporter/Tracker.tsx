import * as React from 'react'
import {merge, ReplaySubject, Subject} from 'rxjs'
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
  tap
} from 'rxjs/operators'
import {createResizeObserver, ObservableResizeObserver} from './resizeObserver'
import {
  Context,
  RegionReporterEvent,
  RegionReporterMountEvent,
  RegionReporterUnmountEvent,
  RegionReporterUpdateEvent
} from './context'
import {OverlayItem, Rect} from './types'

function isId<T extends {id: string}>(id: string) {
  return (event: T) => event.id === id
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

type TrackerProps<ComponentProps> = {
  component: React.ComponentType<
    ComponentProps & {
      regions: OverlayItem[]
      children: React.ReactNode
      trackerRef: React.RefObject<HTMLElement>
    }
  >
  children: React.ReactNode
  style?: React.CSSProperties
  componentProps: ComponentProps
}

export const Tracker = React.memo(function Tracker<ComponentProps extends {}>(
  props: TrackerProps<ComponentProps>
) {
  const trackerRef = React.useRef<HTMLElement>()
  const [items, setItems] = React.useState([])

  const regionReporterElementEvents$: Subject<RegionReporterEvent> = React.useMemo(
    () => new ReplaySubject<RegionReporterEvent>(),
    []
  )

  React.useEffect(() => {
    const resizeObserver: ObservableResizeObserver = createResizeObserver()

    const trackerBounds$ = resizeObserver
      .observe(trackerRef.current)
      .pipe(publishReplay(1), refCount())

    const all$ = regionReporterElementEvents$.pipe(share())

    const mounts$ = all$.pipe(filter((ev): ev is RegionReporterMountEvent => ev.type === 'mount'))
    const updates$ = all$.pipe(
      filter((ev: RegionReporterEvent): ev is RegionReporterUpdateEvent => ev.type === 'update')
    )
    const unmounts$ = all$.pipe(
      filter((ev): ev is RegionReporterUnmountEvent => ev.type === 'unmount')
    )

    const positions$ = mounts$.pipe(
      mergeMap((mountEvent: RegionReporterMountEvent, i) => {
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
              data: update.data,
              component: update.component,
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
                ? {
                    id: event.id,
                    data: event.data || item.data,
                    component: event.component || item.component,
                    rect: event.rect || item.rect
                  }
                : item
            )
          }
          return items.concat({
            id: event.id,
            rect: event.rect,
            data: event.data,
            component: event.component
          })
        }

        if (event.type === 'remove') {
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
    regionReporterElementEvents$.next(event)
  }, [])

  const {component: Component, componentProps} = props
  return (
    <Context.Provider value={{dispatch}}>
      <Component {...componentProps} regions={items} trackerRef={trackerRef}>
        {props.children}
      </Component>
    </Context.Provider>
  )
})
