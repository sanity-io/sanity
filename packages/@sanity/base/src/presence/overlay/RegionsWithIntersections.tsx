import React from 'react'
import {tap} from 'rxjs/operators'
import {
  SNAP_TO_DOCK_DISTANCE_BOTTOM,
  SNAP_TO_DOCK_DISTANCE_TOP,
  DEBUG,
  INTERSECTION_ELEMENT_PADDING,
  INTERSECTION_THRESHOLDS,
} from '../constants'
import {ReportedRegionWithRect, RegionWithIntersectionDetails, FieldPresenceData} from '../types'
import {createIntersectionObserver, ObservableIntersectionObserver} from './intersectionObserver'
import styles from './RegionsWithIntersections.css'

interface WithIntersectionProps extends React.ComponentProps<'div'> {
  onIntersection: (id, IntersectionObserverEntry) => void
  io: ObservableIntersectionObserver
  id: string
}
const WithIntersection = (props: WithIntersectionProps) => {
  const {onIntersection, io, id, ...rest} = props
  const element = React.useRef<HTMLDivElement | null>(null)
  React.useEffect(() => {
    const el = element.current
    if (!el) return undefined
    const subscription = io
      .observe(el)
      .pipe(tap((entry) => onIntersection(id, entry)))
      .subscribe()
    return () => subscription.unsubscribe()
  }, [io])

  return <div ref={element} {...rest} />
}

type Props = {
  regions: ReportedRegionWithRect<FieldPresenceData>[]
  render: (
    regionsWithIntersectionDetails: RegionWithIntersectionDetails[],
    containerWidth: number
  ) => React.ReactNode | null
  children: React.ReactNode
  margins: [number, number, number, number]
}

const toPx = (num: number) => `${num}px`
const invert = (num: number) => -num

export const RegionsWithIntersections = React.forwardRef(function RegionsWithIntersections(
  props: Props,
  ref: any
) {
  const {regions, render, children, margins} = props

  const overlayRef = React.useRef<HTMLDivElement | null>(null)

  const io = React.useMemo(
    () =>
      createIntersectionObserver({
        rootMargin: margins.map(invert).map(toPx).join(' '),
        threshold: INTERSECTION_THRESHOLDS,
      }),
    []
  )

  const [intersections, setIntersections] = React.useState({})

  const onIntersection = React.useCallback((id, entry) => {
    setIntersections((current) => ({...current, [id]: entry}))
  }, [])

  const top = intersections['::top']
  const bottom = intersections['::bottom']
  const regionsWithIntersectionDetails: RegionWithIntersectionDetails[] = (top && bottom
    ? regions
        .filter((region) => region.presence?.length > 0)
        .map((region): RegionWithIntersectionDetails | null => {
          const intersection = intersections[region.id]
          if (!intersection) {
            return null
          }

          const {bottom: boundsBottom, top: boundsTop} = intersection.boundingClientRect

          const aboveTop = intersection.boundingClientRect.top < top.boundingClientRect.bottom
          const belowBottom = intersection.boundingClientRect.top < bottom.boundingClientRect.top
          const distanceTop = intersection.isIntersecting
            ? boundsTop - (intersection.intersectionRect.top - INTERSECTION_ELEMENT_PADDING)
            : aboveTop
            ? -top.boundingClientRect.bottom
            : bottom.boundingClientRect.top

          const distanceBottom = intersection.isIntersecting
            ? -(
                boundsBottom -
                (intersection.intersectionRect.bottom + INTERSECTION_ELEMENT_PADDING)
              )
            : belowBottom
            ? bottom.boundingClientRect.top
            : -top.boundingClientRect.bottom

          const position =
            distanceTop <= SNAP_TO_DOCK_DISTANCE_TOP
              ? 'top'
              : distanceBottom <= SNAP_TO_DOCK_DISTANCE_BOTTOM
              ? 'bottom'
              : 'inside'

          return {
            distanceTop,
            distanceBottom,
            region,
            position,
          }
        })
        .filter(Boolean)
    : []) as RegionWithIntersectionDetails[]

  return (
    <div className={styles.root} ref={ref}>
      <WithIntersection
        io={io}
        id="::top"
        onIntersection={onIntersection}
        style={{
          zIndex: 100,
          position: 'sticky',
          top: margins[0] - 1,
          height: 1,
          backgroundColor: DEBUG ? 'red' : 'none',
        }}
      />
      <div>{children}</div>
      <div
        ref={overlayRef}
        className={styles.overlay}
        style={{background: DEBUG ? 'rgba(255; 0; 0; 0.25)' : ''}}
      >
        {overlayRef.current &&
          render(regionsWithIntersectionDetails, overlayRef.current.offsetWidth)}
      </div>
      {regions.map((region) => {
        const forceWidth = region.rect.width === 0
        return (
          <WithIntersection
            className={styles.region}
            io={io}
            onIntersection={onIntersection}
            key={region.id}
            id={region.id}
            style={{
              ...(DEBUG
                ? {
                    background: 'rgba(255, 0, 0, 0.25)',
                    outline: '1px solid #00b',
                  }
                : {}),
              width: forceWidth ? 1 : region.rect.width,
              left: region.rect.left - (forceWidth ? 1 : 0),
              top: region.rect.top - INTERSECTION_ELEMENT_PADDING,
              height: region.rect.height + INTERSECTION_ELEMENT_PADDING * 2,
              visibility: DEBUG ? 'visible' : 'hidden',
            }}
          />
        )
      })}
      <WithIntersection
        id="::bottom"
        io={io}
        onIntersection={onIntersection}
        style={{
          position: 'sticky',
          bottom: -1,
          height: 1,
          backgroundColor: DEBUG ? 'blue' : 'none',
        }}
      />
    </div>
  )
})
