/* eslint-disable react/no-multi-comp */
import * as React from 'react'
import {createIntersectionObserver, ObservableIntersectionObserver} from './intersectionObserver'
import {tap} from 'rxjs/operators'
import {
  SNAP_TO_DOCK_DISTANCE_BOTTOM,
  SNAP_TO_DOCK_DISTANCE_TOP,
  DEBUG,
  INTERSECTION_ELEMENT_PADDING,
  INTERSECTION_THRESHOLDS
} from '../constants'
import {RegionWithIntersectionDetails} from '../types'

const OVERLAY_STYLE: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  pointerEvents: 'none',
  background: DEBUG ? 'rgba(255, 255, 0, 0.25)' : '',
  zIndex: 5
}

const OVERLAY_ITEM_STYLE: React.CSSProperties = {
  background: DEBUG ? 'rgba(255, 0, 0, 0.25)' : '',
  overflow: 'hidden',
  pointerEvents: 'none',
  outline: '1px solid #00b',
  position: 'absolute'
}

interface WithIntersectionProps extends React.ComponentProps<'div'> {
  onIntersection: (id, IntersectionObserverEntry) => void
  io: ObservableIntersectionObserver
  id: string
}
const WithIntersection = (props: WithIntersectionProps) => {
  const {onIntersection, io, id, ...rest} = props
  const element = React.useRef()
  React.useEffect(() => {
    const subscription = io
      .observe(element.current)
      .pipe(tap(entry => onIntersection(id, entry)))
      .subscribe()
    return () => subscription.unsubscribe()
  }, [io])

  return <div ref={element} {...rest} />
}

type Props = {
  regions: any[]
  render: (
    regionsWithIntersectionDetails: RegionWithIntersectionDetails[]
  ) => React.ReactNode | null
  children: React.ReactNode
  trackerRef: React.RefObject<any>
  margins: [number, number, number, number]
}

const toPx = (num: number) => `${num}px`
const invert = (num: number) => -num

export function RegionsWithIntersections(props: Props) {
  const {regions, render, children, trackerRef, margins} = props

  const io = React.useMemo(
    () =>
      createIntersectionObserver({
        rootMargin: (margins)
          .map(invert)
          .map(toPx)
          .join(' '),
        threshold: INTERSECTION_THRESHOLDS
      }),
    []
  )

  const [intersections, setIntersections] = React.useState({})

  const onIntersection = React.useCallback((id, entry) => {
    setIntersections(current => ({...current, [id]: entry}))
  }, [])

  const top = intersections['::top']
  const bottom = intersections['::bottom']
  const regionsWithIntersectionDetails: RegionWithIntersectionDetails[] =
    top && bottom
      ? regions
          .map(
            (region): RegionWithIntersectionDetails => {
              const intersection = intersections[region.id]
              if (!intersection) {
                return null
              }

              const {bottom: boundsBottom, top: boundsTop} = intersection.boundingClientRect

              const aboveTop = intersection.boundingClientRect.top < top.boundingClientRect.bottom
              const belowBottom =
                intersection.boundingClientRect.top < bottom.boundingClientRect.top

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
                distanceTop < SNAP_TO_DOCK_DISTANCE_TOP
                  ? 'top'
                  : distanceBottom < SNAP_TO_DOCK_DISTANCE_BOTTOM
                  ? 'bottom'
                  : 'inside'
              return {
                distanceTop,
                distanceBottom,
                region,
                position
              }
            }
          )
          .filter(Boolean)
      : []

  return (
    <div ref={trackerRef} style={{position: 'relative'}}>
      <WithIntersection
        io={io}
        id="::top"
        onIntersection={onIntersection}
        style={{
          position: 'sticky',
          top: margins[0],
          height: 1,
          backgroundColor: DEBUG ? 'red' : 'none'
        }}
      />
      <div>{children}</div>
      <div style={OVERLAY_STYLE}>
        {regionsWithIntersectionDetails && render(regionsWithIntersectionDetails)}
      </div>
      <div style={OVERLAY_STYLE}>
        {regions.map(region => {
          const forceWidth = region.rect.width === 0
          return (
            <WithIntersection
              io={io}
              onIntersection={onIntersection}
              key={region.id}
              id={region.id}
              style={{
                ...OVERLAY_ITEM_STYLE,
                width: forceWidth ? 1 : region.rect.width,
                left: region.rect.left - (forceWidth ? 1 : 0),
                top: region.rect.top - INTERSECTION_ELEMENT_PADDING,
                height: region.rect.height + INTERSECTION_ELEMENT_PADDING * 2,
                visibility: DEBUG ? 'visible' : 'hidden'
              }}
            />
          )
        })}
      </div>
      <div style={{padding: 20}} />
      <WithIntersection
        id="::bottom"
        io={io}
        onIntersection={onIntersection}
        style={{
          position: 'sticky',
          bottom: 0,
          height: 1,
          backgroundColor: DEBUG ? 'blue' : 'none'
        }}
      />
    </div>
  )
}
