import * as React from 'react'
import {concat, merge, of, ReplaySubject, Subject} from 'rxjs'
import {
  debounceTime,
  filter,
  map,
  mergeMap,
  publishReplay,
  refCount,
  scan,
  share,
  takeUntil,
  tap
} from 'rxjs/operators'
import {createResizeObserver, ObservableResizeObserver} from './resizeObserver'
import {
  OverlayReporterContext,
  RegionReporterEvent,
  RegionReporterMountEvent,
  RegionReporterUnmountEvent,
  RegionReporterUpdateEvent,
  ReportedRegion
} from './types'
import {createReporter} from './createReporter'

function isId<T extends {id: string}>(id: string) {
  return (event: T) => event.id === id
}

export type TrackerComponentProps<ComponentProps, RegionData> = ComponentProps & {
  regions: ReportedRegion<RegionData>[]
  children: React.ReactNode
  trackerRef: React.RefObject<HTMLElement | null>
}

export type TrackerProps<ComponentProps, RegionData = {}> = {
  component: React.ComponentType<TrackerComponentProps<ComponentProps, RegionData>>
  children: React.ReactNode
  style?: React.CSSProperties
  componentProps: ComponentProps
}

export function createTracker() {
  const Context: React.Context<OverlayReporterContext> = React.createContext({
    dispatch: (event: RegionReporterEvent): void => {
      console.error(
        'Tried to report a region without being wrapped in a context provider to handle it. Please make sure the component is wrapped in a <Overlay> component.'
      )
    }
  })

  const Tracker = React.memo(function Tracker<ComponentProps extends {}, RegionData extends {}>(
    props: TrackerProps<ComponentProps, RegionData>
  ) {
    const trackerRef = React.useRef<HTMLElement>()
    const [regions, setRegions] = React.useState<ReportedRegion<RegionData>[]>([])

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

      const regions$ = mounts$.pipe(
        mergeMap((mountEvent: RegionReporterMountEvent, i) => {
          const elementId = mountEvent.id
          const unmounted$ = unmounts$.pipe(filter(isId(elementId)), share())
          const elementUpdates$ = updates$.pipe(filter(isId(elementId)), share())

          return concat(
            of({
              type: 'add' as const,
              id: elementId,
              element: mountEvent.element,
              data: mountEvent.data
            }),
            merge(
              trackerBounds$.pipe(
                map(() => ({
                  type: 'update' as const,
                  id: elementId
                }))
              ),
              elementUpdates$.pipe(
                map(update => ({
                  type: 'update' as const,
                  id: elementId,
                  data: update.data,
                  component: update.component
                }))
              )
            ).pipe(takeUntil(unmounted$)),
            of({type: 'remove' as const, id: elementId})
          )
        }),
        scan((items, event) => {
          if (event.type === 'add') {
            if (items.has(event.id)) {
              throw new Error(`Integrity check failed: Region with id "${event.id}" already exists`)
            }
            items.set(event.id, {id: event.id, element: event.element, data: event.data})
          }
          if (event.type === 'update') {
            const existing = items.get(event.id)
            if (!existing) {
              throw new Error(`Integrity check failed: Region with id "${event.id}" is not known`)
            }
            items.set(event.id, {...existing, ...event})
          }
          if (event.type === 'remove') {
            if (!items.has(event.id)) {
              throw new Error(`Integrity check failed: Region with id "${event.id}" is not known`)
            }
            items.delete(event.id)
          }
          return items
        }, new Map<string, ReportedRegion<RegionData>>()),
        // debounceTime()
      )
      const sub = regions$
        .pipe(
          map(items => Array.from(items.values())),
          tap(setRegions)
        )
        .subscribe()
      return () => sub.unsubscribe()
    }, [])

    const dispatch = React.useCallback(event => {
      regionReporterElementEvents$.next(event)
    }, [])

    const {component: Component, componentProps} = props
    return (
      <Context.Provider value={{dispatch}}>
        <Component {...componentProps} regions={regions} trackerRef={trackerRef}>
          {props.children}
        </Component>
      </Context.Provider>
    )
  })

  return {Tracker, Reporter: createReporter(Context)}
}
